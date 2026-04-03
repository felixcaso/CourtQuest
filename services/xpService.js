import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

/**
 * XP Values:
 *   claim court  +50
 *   visit court  +10
 *   post         +5
 *   video analysis +25
 *   mission reward  varies
 *   referral bonus  50/25
 */

export async function awardXP(uid, amount, reason) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    xp: increment(amount),
  });

  // Also update crew totalXP if user is in a crew
  try {
    const { getDoc } = require('firebase/firestore');
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().crewId) {
      const crewRef = doc(db, 'crews', snap.data().crewId);
      await updateDoc(crewRef, { totalXP: increment(amount) }).catch(() => {});
    }
  } catch (e) {
    // Non-critical — don't break the flow
  }

  // Trigger badge check and mission progress (async, non-blocking)
  try {
    const { checkAndAwardBadges } = require('./badgeService');
    checkAndAwardBadges(uid).catch(() => {});
  } catch (e) {}

  try {
    const { updateMissionProgress } = require('./missionService');
    const actionMap = {
      claim_court: 'claim_court',
      visit_court: 'visit_court',
      post: 'post',
      video_analysis: 'video_analysis',
    };
    if (actionMap[reason]) {
      updateMissionProgress(uid, actionMap[reason]).catch(() => {});
    }
  } catch (e) {}
}

export function getLevel(xp) {
  return Math.floor((xp || 0) / 100) + 1;
}
