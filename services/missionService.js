import { db } from '../firebase';
import {
  doc, getDoc, setDoc, getDocs, collection, query, where, updateDoc, increment,
} from 'firebase/firestore';
import { awardXP } from './xpService';

/**
 * Daily mission templates.
 */
const MISSION_TEMPLATES = [
  {
    id: 'visit_court',
    title: 'Visit a Court',
    description: 'Walk to any court on the map',
    xpReward: 10,
    target: 1,
    icon: '📍',
    trackingField: 'courtsVisitedToday',
  },
  {
    id: 'post_community',
    title: 'Post in Community',
    description: 'Share something with the community',
    xpReward: 5,
    target: 1,
    icon: '💬',
    trackingField: 'postsToday',
  },
  {
    id: 'claim_court',
    title: 'Claim a Court',
    description: 'Claim an unclaimed court as King',
    xpReward: 50,
    target: 1,
    icon: '👑',
    trackingField: 'claimsToday',
  },
  {
    id: 'video_analysis',
    title: 'Analyze Your Game',
    description: 'Complete a video analysis session',
    xpReward: 25,
    target: 1,
    icon: '🎬',
    trackingField: 'analysesToday',
  },
  {
    id: 'visit_3_courts',
    title: 'Court Explorer',
    description: 'Visit 3 different courts today',
    xpReward: 30,
    target: 3,
    icon: '🗺️',
    trackingField: 'courtsVisitedToday',
  },
  {
    id: 'win_challenge',
    title: 'Victor',
    description: 'Win a challenge today',
    xpReward: 30,
    target: 1,
    icon: '🏆',
    trackingField: 'challengeWinsToday',
  },
  {
    id: 'complete_challenge',
    title: 'Competitor',
    description: 'Complete a challenge today',
    xpReward: 15,
    target: 1,
    icon: '⚔️',
    trackingField: 'challengesCompletedToday',
  },
];

/**
 * Get today's date string (YYYY-MM-DD).
 */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Assign daily missions to a user (pick 3 from the template pool).
 * Called once per day when the user opens missions.
 */
export async function assignDailyMissions(uid) {
  if (!uid) return [];

  const today = todayStr();
  const missionsRef = collection(db, 'users', uid, 'missions');

  // Check if already assigned today
  const existing = await getDocs(query(missionsRef, where('date', '==', today)));
  if (!existing.empty) {
    return existing.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Pick 3 random missions (avoid duplicates based on trackingField)
  const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = [];
  const usedFields = new Set();
  for (const template of shuffled) {
    if (selected.length >= 3) break;
    if (!usedFields.has(template.trackingField)) {
      selected.push(template);
      usedFields.add(template.trackingField);
    }
  }

  // Save to Firestore
  const missions = [];
  for (const template of selected) {
    const missionDoc = doc(missionsRef, `${today}_${template.id}`);
    const missionData = {
      ...template,
      date: today,
      progress: 0,
      completed: false,
      claimed: false,
    };
    await setDoc(missionDoc, missionData);
    missions.push({ id: missionDoc.id, ...missionData });
  }

  return missions;
}

/**
 * Get today's missions for a user.
 */
export async function getTodayMissions(uid) {
  if (!uid) return [];
  const today = todayStr();
  const missionsRef = collection(db, 'users', uid, 'missions');
  const snap = await getDocs(query(missionsRef, where('date', '==', today)));
  if (snap.empty) {
    // Auto-assign if none exist
    return assignDailyMissions(uid);
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update mission progress based on an action.
 * @param {string} uid
 * @param {string} actionType - 'visit_court' | 'post' | 'claim_court' | 'video_analysis'
 */
export async function updateMissionProgress(uid, actionType) {
  if (!uid) return;

  const fieldMap = {
    visit_court: 'courtsVisitedToday',
    post: 'postsToday',
    claim_court: 'claimsToday',
    video_analysis: 'analysesToday',
    challenge_win: 'challengeWinsToday',
    challenge_complete: 'challengesCompletedToday',
  };

  const trackingField = fieldMap[actionType];
  if (!trackingField) return;

  const today = todayStr();
  const missionsRef = collection(db, 'users', uid, 'missions');
  const snap = await getDocs(query(missionsRef, where('date', '==', today)));

  for (const missionDoc of snap.docs) {
    const data = missionDoc.data();
    if (data.trackingField === trackingField && !data.completed) {
      const newProgress = Math.min((data.progress || 0) + 1, data.target);
      const completed = newProgress >= data.target;
      await updateDoc(missionDoc.ref, {
        progress: newProgress,
        completed,
      });
    }
  }
}

/**
 * Claim XP reward for a completed mission.
 */
export async function claimMissionReward(uid, missionId) {
  if (!uid || !missionId) return false;

  const missionRef = doc(db, 'users', uid, 'missions', missionId);
  const snap = await getDoc(missionRef);
  if (!snap.exists()) return false;

  const data = snap.data();
  if (!data.completed || data.claimed) return false;

  await updateDoc(missionRef, { claimed: true });
  await awardXP(uid, data.xpReward, `mission_${data.id}`);

  return true;
}
