import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Check and update daily streak on app open.
 * - Yesterday -> increment streak
 * - Today -> no-op
 * - Older -> reset to 1
 */
export async function checkAndUpdateStreak(uid) {
  if (!uid) return;

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const lastActive = data.lastActiveDate || null;

  if (lastActive === todayStr) {
    // Already checked in today — no-op
    return;
  }

  // Calculate yesterday's date string
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak;
  if (lastActive === yesterdayStr) {
    // Consecutive day — increment
    newStreak = (data.currentStreak || 0) + 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  await updateDoc(userRef, {
    currentStreak: newStreak,
    lastActiveDate: todayStr,
  });
}
