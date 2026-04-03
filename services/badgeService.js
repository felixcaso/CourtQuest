import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Badge definitions.
 */
const BADGE_DEFINITIONS = [
  {
    id: 'court_regular',
    name: 'Court Regular',
    emoji: '📍',
    description: 'Visit 10 different courts',
    check: (data) => (data.visitedCourts || []).length >= 10,
  },
  {
    id: 'king_maker',
    name: 'King Maker',
    emoji: '👑',
    description: 'Claim 5 courts',
    check: (data) => (data.courtsClaimed || 0) >= 5,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    emoji: '🦋',
    description: 'Make 10 community posts',
    check: (data) => (data.postsCount || 0) >= 10,
  },
  {
    id: 'analyzer',
    name: 'Analyzer',
    emoji: '🎬',
    description: 'Complete 5 video analyses',
    check: (data) => (data.gamesPlayed || 0) >= 5,
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    emoji: '🔥',
    description: 'Achieve a 7-day streak',
    check: (data) => (data.currentStreak || 0) >= 7,
  },
  {
    id: 'first_claim',
    name: 'First Blood',
    emoji: '⚔️',
    description: 'Claim your first court',
    check: (data) => (data.courtsClaimed || 0) >= 1,
  },
  {
    id: 'first_post',
    name: 'Voice Heard',
    emoji: '📢',
    description: 'Make your first community post',
    check: (data) => (data.postsCount || 0) >= 1,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    emoji: '🗺️',
    description: 'Visit 5 different courts',
    check: (data) => (data.visitedCourts || []).length >= 5,
  },
  {
    id: 'xp_grinder',
    name: 'XP Grinder',
    emoji: '💪',
    description: 'Earn 500 XP',
    check: (data) => (data.xp || 0) >= 500,
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    emoji: '⭐',
    description: 'Reach Level 5',
    check: (data) => Math.floor((data.xp || 0) / 100) + 1 >= 5,
  },
  {
    id: 'crew_member',
    name: 'Team Player',
    emoji: '🤝',
    description: 'Join a crew',
    check: (data) => !!data.crewId,
  },
  {
    id: 'referrer',
    name: 'Ambassador',
    emoji: '🎁',
    description: 'Refer 3 friends',
    check: (data) => (data.referralCount || 0) >= 3,
  },
];

/**
 * Check all badges for a user and award any newly earned ones.
 * Call this after XP-granting actions.
 * @returns {Array} newly awarded badges
 */
export async function checkAndAwardBadges(uid) {
  if (!uid) return [];

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return [];

  const data = snap.data();
  const existingBadgeIds = (data.badges || []).map(b => typeof b === 'string' ? b : b.id);
  const newBadges = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!existingBadgeIds.includes(badge.id) && badge.check(data)) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        awardedAt: new Date().toISOString(),
      });
    }
  }

  if (newBadges.length > 0) {
    for (const badge of newBadges) {
      await updateDoc(userRef, {
        badges: arrayUnion(badge),
      });
    }
  }

  return newBadges;
}

/**
 * Get all badge definitions (for display purposes).
 */
export function getAllBadgeDefinitions() {
  return BADGE_DEFINITIONS.map(b => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    description: b.description,
  }));
}
