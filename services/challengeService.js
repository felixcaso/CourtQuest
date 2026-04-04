import { db } from '../firebase';
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, query,
  where, orderBy, serverTimestamp, increment,
} from 'firebase/firestore';
import { awardXP } from './xpService';

/**
 * Challenge Service
 * Firestore collection: challenges/{challengeId}
 *
 * Status flow:
 *   pending -> accepted -> in_progress -> awaiting_confirmation -> completed
 *   pending -> declined
 */

/**
 * Send a challenge to another player.
 */
export async function sendChallenge(challengerUid, challengerName, targetUid, targetName, courtId, courtName) {
  if (!challengerUid || !targetUid) throw new Error('Missing UIDs');
  if (challengerUid === targetUid) throw new Error('Cannot challenge yourself');

  const challengeData = {
    challengerUid,
    challengerName,
    targetUid,
    targetName,
    courtId: courtId || null,
    courtName: courtName || 'TBD',
    status: 'pending',
    reportedWinner: null,
    reportedBy: null,
    winnerUid: null,
    loserUid: null,
    confirmedAt: null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'challenges'), challengeData);
  return docRef.id;
}

/**
 * Accept a pending challenge.
 */
export async function acceptChallenge(challengeId, targetUid) {
  const ref = doc(db, 'challenges', challengeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Challenge not found');
  const data = snap.data();
  if (data.targetUid !== targetUid) throw new Error('Not your challenge to accept');
  if (data.status !== 'pending') throw new Error('Challenge is not pending');

  await updateDoc(ref, {
    status: 'in_progress',
    acceptedAt: serverTimestamp(),
  });
}

/**
 * Decline a pending challenge.
 */
export async function declineChallenge(challengeId, targetUid) {
  const ref = doc(db, 'challenges', challengeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Challenge not found');
  const data = snap.data();
  if (data.targetUid !== targetUid) throw new Error('Not your challenge to decline');
  if (data.status !== 'pending') throw new Error('Challenge is not pending');

  await updateDoc(ref, {
    status: 'declined',
    declinedAt: serverTimestamp(),
  });
}

/**
 * Report the result of a challenge (first reporter).
 */
export async function reportResult(challengeId, winnerUid, reporterUid) {
  const ref = doc(db, 'challenges', challengeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Challenge not found');
  const data = snap.data();

  // Only participants can report
  if (reporterUid !== data.challengerUid && reporterUid !== data.targetUid) {
    throw new Error('Not a participant');
  }
  if (data.status !== 'in_progress') throw new Error('Challenge not in progress');
  // Winner must be one of the participants
  if (winnerUid !== data.challengerUid && winnerUid !== data.targetUid) {
    throw new Error('Invalid winner');
  }

  await updateDoc(ref, {
    status: 'awaiting_confirmation',
    reportedWinner: winnerUid,
    reportedBy: reporterUid,
    reportedAt: serverTimestamp(),
  });
}

/**
 * Confirm (or dispute) the reported result.
 * Only the player who did NOT report can confirm.
 */
export async function confirmResult(challengeId, confirmerUid) {
  const ref = doc(db, 'challenges', challengeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Challenge not found');
  const data = snap.data();

  if (data.status !== 'awaiting_confirmation') throw new Error('Not awaiting confirmation');
  // Confirmer must be the other participant
  if (confirmerUid === data.reportedBy) throw new Error('You already reported — wait for opponent');
  if (confirmerUid !== data.challengerUid && confirmerUid !== data.targetUid) {
    throw new Error('Not a participant');
  }

  const winnerUid = data.reportedWinner;
  const loserUid = winnerUid === data.challengerUid ? data.targetUid : data.challengerUid;

  await updateDoc(ref, {
    status: 'completed',
    winnerUid,
    loserUid,
    confirmedAt: serverTimestamp(),
  });

  // Award XP: winner +30, loser +10
  await awardXP(winnerUid, 30, 'challenge_win').catch(() => {});
  await awardXP(loserUid, 10, 'challenge_loss').catch(() => {});

  // Update win/loss stats on user docs
  try {
    const winnerRef = doc(db, 'users', winnerUid);
    const loserRef = doc(db, 'users', loserUid);
    await updateDoc(winnerRef, {
      challengeWins: increment(1),
      challengeStreak: increment(1),
    }).catch(() => {});
    await updateDoc(loserRef, {
      challengeLosses: increment(1),
      challengeStreak: 0,
    }).catch(() => {});

    // Track rivalry: store opponent counts in a sub-map
    // We use a flat field for simplicity: rivalries.{opponentUid} = count
    // Skipping sub-doc for now — badge check handles it from challenges collection
  } catch (e) {
    // Non-critical
  }

  // King of the Court transfer: if at a court and king loses
  if (data.courtId) {
    try {
      const courtRef = doc(db, 'courts', data.courtId);
      const courtSnap = await getDoc(courtRef);
      if (courtSnap.exists()) {
        const courtData = courtSnap.data();
        const currentKingUid = courtData.currentKing?.uid;
        // If the loser is the current king, transfer crown to winner
        if (currentKingUid === loserUid) {
          const winnerUserSnap = await getDoc(doc(db, 'users', winnerUid));
          const winnerData = winnerUserSnap.exists() ? winnerUserSnap.data() : {};
          const winnerName = winnerData.displayName || data.challengerUid === winnerUid ? data.challengerName : data.targetName;
          const winnerInitials = (winnerName || '').slice(0, 2).toUpperCase();
          await updateDoc(courtRef, {
            currentKing: { uid: winnerUid, name: winnerName, initials: winnerInitials },
            name: winnerName,
            initials: winnerInitials,
            confirmed: true,
            claimedAt: serverTimestamp(),
            wins: (courtData.wins || 0) + 1,
            crewId: winnerData.crewId || null,
            crewName: winnerData.crewName || '',
          });
          // Update winner's courtsClaimed
          await updateDoc(doc(db, 'users', winnerUid), {
            courtsClaimed: increment(1),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('King transfer error:', e);
    }
  }

  // Trigger badge check for both players
  try {
    const { checkAndAwardBadges } = require('./badgeService');
    checkAndAwardBadges(winnerUid).catch(() => {});
    checkAndAwardBadges(loserUid).catch(() => {});
  } catch (e) {}

  // Update mission progress
  try {
    const { updateMissionProgress } = require('./missionService');
    updateMissionProgress(winnerUid, 'challenge_win').catch(() => {});
    updateMissionProgress(loserUid, 'challenge_complete').catch(() => {});
  } catch (e) {}
}

/**
 * Dispute the reported result — revert to in_progress so they can re-report.
 */
export async function disputeResult(challengeId, disputerUid) {
  const ref = doc(db, 'challenges', challengeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Challenge not found');
  const data = snap.data();

  if (data.status !== 'awaiting_confirmation') throw new Error('Not awaiting confirmation');
  if (disputerUid === data.reportedBy) throw new Error('You reported — wait for opponent');
  if (disputerUid !== data.challengerUid && disputerUid !== data.targetUid) {
    throw new Error('Not a participant');
  }

  await updateDoc(ref, {
    status: 'in_progress',
    reportedWinner: null,
    reportedBy: null,
  });
}

/**
 * Get all pending/active (non-completed, non-declined) challenges for a user.
 */
export async function getChallengesForUser(uid) {
  if (!uid) return [];

  // Query where user is challenger
  const q1 = query(
    collection(db, 'challenges'),
    where('challengerUid', '==', uid),
    where('status', 'in', ['pending', 'in_progress', 'awaiting_confirmation']),
  );
  // Query where user is target
  const q2 = query(
    collection(db, 'challenges'),
    where('targetUid', '==', uid),
    where('status', 'in', ['pending', 'in_progress', 'awaiting_confirmation']),
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const challenges = [];
  const seen = new Set();

  snap1.docs.forEach(d => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      challenges.push({ id: d.id, ...d.data() });
    }
  });
  snap2.docs.forEach(d => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      challenges.push({ id: d.id, ...d.data() });
    }
  });

  // Sort by createdAt descending
  challenges.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() || new Date(0);
    const bTime = b.createdAt?.toDate?.() || new Date(0);
    return bTime - aTime;
  });

  return challenges;
}

/**
 * Get completed/declined challenge history for a user.
 */
export async function getChallengeHistory(uid) {
  if (!uid) return [];

  const q1 = query(
    collection(db, 'challenges'),
    where('challengerUid', '==', uid),
    where('status', 'in', ['completed', 'declined']),
  );
  const q2 = query(
    collection(db, 'challenges'),
    where('targetUid', '==', uid),
    where('status', 'in', ['completed', 'declined']),
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const challenges = [];
  const seen = new Set();

  snap1.docs.forEach(d => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      challenges.push({ id: d.id, ...d.data() });
    }
  });
  snap2.docs.forEach(d => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      challenges.push({ id: d.id, ...d.data() });
    }
  });

  challenges.sort((a, b) => {
    const aTime = a.confirmedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
    const bTime = b.confirmedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
    return bTime - aTime;
  });

  return challenges;
}

/**
 * Get the count of pending incoming challenges for badge display.
 */
export async function getPendingChallengeCount(uid) {
  if (!uid) return 0;
  const q = query(
    collection(db, 'challenges'),
    where('targetUid', '==', uid),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.size;
}
