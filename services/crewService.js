import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs,
  collection, query, where, arrayUnion, arrayRemove,
  serverTimestamp, increment,
} from 'firebase/firestore';

/**
 * Generate a random 6-char crew join code.
 */
function generateCrewCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new crew.
 * @returns {string} crewId
 */
export async function createCrew(uid, crewName) {
  if (!uid || !crewName) throw new Error('Missing uid or crewName');

  const crewCode = generateCrewCode();
  const crewId = `crew_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Get creator info
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const displayName = userData.displayName || 'Unknown';

  await setDoc(doc(db, 'crews', crewId), {
    name: crewName,
    creatorUid: uid,
    joinCode: crewCode,
    members: [{ uid, displayName, joinedAt: new Date() }],
    memberCount: 1,
    totalXP: userData.xp || 0,
    courtsControlled: 0,
    createdAt: serverTimestamp(),
  });

  // Update user doc
  await updateDoc(doc(db, 'users', uid), {
    crewId,
    crewName,
  });

  return { crewId, joinCode: crewCode };
}

/**
 * Join a crew by join code.
 */
export async function joinCrew(uid, joinCode) {
  if (!uid || !joinCode) throw new Error('Missing uid or joinCode');

  // Find crew by join code
  const q = query(collection(db, 'crews'), where('joinCode', '==', joinCode.toUpperCase()));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('No crew found with that code');

  const crewDoc = snap.docs[0];
  const crewId = crewDoc.id;
  const crewData = crewDoc.data();

  // Check if already a member
  if (crewData.members.some(m => m.uid === uid)) {
    throw new Error('You are already in this crew');
  }

  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const displayName = userData.displayName || 'Unknown';

  await updateDoc(doc(db, 'crews', crewId), {
    members: arrayUnion({ uid, displayName, joinedAt: new Date() }),
    memberCount: increment(1),
    totalXP: increment(userData.xp || 0),
  });

  await updateDoc(doc(db, 'users', uid), {
    crewId,
    crewName: crewData.name,
  });

  return { crewId, crewName: crewData.name };
}

/**
 * Leave current crew.
 */
export async function leaveCrew(uid) {
  if (!uid) return;

  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const crewId = userData.crewId;
  if (!crewId) return;

  const crewRef = doc(db, 'crews', crewId);
  const crewSnap = await getDoc(crewRef);
  if (!crewSnap.exists()) return;

  const crewData = crewSnap.data();
  const updatedMembers = (crewData.members || []).filter(m => m.uid !== uid);

  if (updatedMembers.length === 0) {
    // Last member — delete the crew
    await deleteDoc(crewRef);
  } else {
    await updateDoc(crewRef, {
      members: updatedMembers,
      memberCount: increment(-1),
      totalXP: increment(-(userData.xp || 0)),
    });
  }

  await updateDoc(doc(db, 'users', uid), {
    crewId: null,
    crewName: null,
  });
}

/**
 * Get crew details and members.
 */
export async function getCrewDetails(crewId) {
  if (!crewId) return null;
  const snap = await getDoc(doc(db, 'crews', crewId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get all members of a crew with their stats.
 */
export async function getCrewMembers(crewId) {
  if (!crewId) return [];
  const crewSnap = await getDoc(doc(db, 'crews', crewId));
  if (!crewSnap.exists()) return [];

  const crewData = crewSnap.data();
  const members = crewData.members || [];

  // Fetch each member's user doc for stats
  const enriched = await Promise.all(
    members.map(async (member) => {
      try {
        const userSnap = await getDoc(doc(db, 'users', member.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        return {
          ...member,
          xp: userData.xp || 0,
          level: Math.floor((userData.xp || 0) / 100) + 1,
          courtsClaimed: userData.courtsClaimed || 0,
        };
      } catch {
        return { ...member, xp: 0, level: 1, courtsClaimed: 0 };
      }
    })
  );

  return enriched.sort((a, b) => b.xp - a.xp);
}

/**
 * Get crew stats.
 */
export async function getCrewStats(crewId) {
  if (!crewId) return null;
  const snap = await getDoc(doc(db, 'crews', crewId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    totalXP: data.totalXP || 0,
    memberCount: data.memberCount || (data.members || []).length,
    courtsControlled: data.courtsControlled || 0,
    createdAt: data.createdAt,
  };
}
