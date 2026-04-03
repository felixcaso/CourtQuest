import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { awardXP } from './xpService';

/**
 * Generate a unique referral code for a user.
 * If they already have one, return the existing code.
 */
export async function generateReferralCode(uid) {
  if (!uid) return null;

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.referralCode) return data.referralCode;

  // Generate a unique code: first 4 chars of uid + random 4
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const code = `CQ${uid.slice(0, 4).toUpperCase()}${suffix}`;

  await updateDoc(userRef, { referralCode: code });
  return code;
}

/**
 * Process a referral code during signup.
 * Credits both the referrer and the new user with bonus XP.
 * @param {string} newUid - The new user's UID
 * @param {string} referralCode - The referral code entered
 * @returns {boolean} success
 */
export async function processReferral(newUid, referralCode) {
  if (!newUid || !referralCode) return false;

  // Find the referrer by iterating — in production, use a separate collection for codes
  // For now, we check the referral code format and search
  const { collection: firestoreCollection, query, where, getDocs } = require('firebase/firestore');
  const q = query(
    firestoreCollection(db, 'users'),
    where('referralCode', '==', referralCode.toUpperCase())
  );

  const snap = await getDocs(q);
  if (snap.empty) return false;

  const referrerDoc = snap.docs[0];
  const referrerUid = referrerDoc.id;

  if (referrerUid === newUid) return false; // Can't refer yourself

  // Credit referrer
  await updateDoc(doc(db, 'users', referrerUid), {
    referralCount: increment(1),
  });
  await awardXP(referrerUid, 50, 'referral_bonus');

  // Credit new user
  await updateDoc(doc(db, 'users', newUid), {
    referredBy: referrerUid,
  });
  await awardXP(newUid, 25, 'referred_signup_bonus');

  return true;
}
