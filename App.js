import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform, Image, ScrollView, Share } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import CourtsScreen from './screens/CourtsScreen';
import ControlScreen from './screens/ControlScreen';
import CommunityScreen from './screens/CommunityScreen';
import MyGameScreen from './screens/MyGameScreen';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import CrewScreen from './screens/CrewScreen';
import MissionsScreen from './screens/MissionsScreen';
import ChallengeScreen from './screens/ChallengeScreen';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { checkAndUpdateStreak } from './services/streakService';
import { getPendingChallengeCount } from './services/challengeService';
import { setupPushNotifications } from './services/pushNotificationService';
import { generateReferralCode } from './services/referralService';

const TABS = [
  { id: 'courts',    label: 'CourtQuest', icon: '🏓' },
  { id: 'control',   label: 'Control',    icon: '🎮' },
  { id: 'community', label: 'Community',  icon: '💬' },
  { id: 'mygame',    label: 'My Game',    icon: '📊' },
  { id: 'profile',   label: 'Profile',    icon: '👤' },
];

// Faction display helpers
const FACTION_INFO = {
  pickle_purists: { name: 'Pickle Purists', emoji: '🥒', color: '#4ADE80' },
  tennis_traditionalists: { name: 'Tennis Traditionalists', emoji: '🎾', color: '#F5961D' },
  paddle_peacemakers: { name: 'Paddle Peacemakers', emoji: '🏓', color: '#818CF8' },
};

const SKILL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

function ProfileScreen({ user, onSignOut, onPhotoChange, onNavigate }) {
  const colors = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];
  const avatarColor = colors[(user.name.charCodeAt(0) || 0) % colors.length];

  const [profileStats, setProfileStats] = useState({
    courtsClaimed: 0, posts: 0, gamesPlayed: 0, xp: 0, level: 1, streak: 0,
    sportAllegiance: null, skillLevel: null, badges: [], crewName: null, crewId: null,
    referralCode: null, referralCount: 0,
  });
  const [showProModal, setShowProModal] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    getPendingChallengeCount(user.uid).then(count => setPendingChallenges(count)).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const xp = data.xp || 0;
        setProfileStats({
          courtsClaimed: data.courtsClaimed || 0,
          posts: data.postsCount || 0,
          gamesPlayed: data.gamesPlayed || 0,
          xp,
          level: Math.floor(xp / 100) + 1,
          streak: data.currentStreak || 0,
          sportAllegiance: data.sportAllegiance || null,
          skillLevel: data.skillLevel || null,
          badges: data.badges || [],
          crewName: data.crewName || null,
          crewId: data.crewId || null,
          referralCode: data.referralCode || null,
          referralCount: data.referralCount || 0,
        });
      }
    }).catch(() => {});
  }, [user]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  const handleShareReferral = async () => {
    if (!user?.uid) return;
    try {
      const code = await generateReferralCode(user.uid);
      if (code) {
        Share.share({
          message: `Join me on CourtQuest! Use my referral code: ${code}\nDownload the app and enter this code when signing up to get bonus XP!`,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Referral error:', e);
    }
  };

  const factionInfo = profileStats.sportAllegiance ? FACTION_INFO[profileStats.sportAllegiance] : null;

  return (
    <View style={profileStyles.container}>
      <View style={profileStyles.header}>
        <Text style={profileStyles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={profileStyles.scrollBody} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={profileStyles.avatarWrapper}>
          {user.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={profileStyles.avatarPhoto} />
          ) : (
            <View style={[profileStyles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={profileStyles.avatarText}>{user.initials}</Text>
            </View>
          )}
          <View style={profileStyles.cameraBadge}>
            <Text style={profileStyles.cameraBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={profileStyles.name}>{user.name}</Text>
        {!!user.email && <Text style={profileStyles.email}>{user.email}</Text>}

        {/* Faction + Skill badges */}
        <View style={profileStyles.badgeRow}>
          {factionInfo && (
            <View style={[profileStyles.factionBadge, { backgroundColor: factionInfo.color + '18', borderColor: factionInfo.color + '40' }]}>
              <Text style={profileStyles.factionBadgeEmoji}>{factionInfo.emoji}</Text>
              <Text style={[profileStyles.factionBadgeText, { color: factionInfo.color }]}>{factionInfo.name}</Text>
            </View>
          )}
          {profileStats.skillLevel && (
            <View style={profileStyles.skillBadge}>
              <Text style={profileStyles.skillBadgeText}>{SKILL_LABELS[profileStats.skillLevel] || profileStats.skillLevel}</Text>
            </View>
          )}
        </View>

        {/* Crew info */}
        {profileStats.crewName && (
          <TouchableOpacity
            style={profileStyles.crewBanner}
            onPress={() => onNavigate && onNavigate('crew')}
            activeOpacity={0.8}
          >
            <Text style={profileStyles.crewBannerEmoji}>⚔️</Text>
            <Text style={profileStyles.crewBannerText}>{profileStats.crewName}</Text>
            <Text style={profileStyles.crewBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* XP / Level / Streak row */}
        <View style={profileStyles.statsRow}>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.level}</Text>
            <Text style={profileStyles.statLabel}>Level</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.xp}</Text>
            <Text style={profileStyles.statLabel}>XP</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.streak}</Text>
            <Text style={profileStyles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={profileStyles.statsRow}>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.courtsClaimed}</Text>
            <Text style={profileStyles.statLabel}>Courts Claimed</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.posts}</Text>
            <Text style={profileStyles.statLabel}>Posts</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>{profileStats.gamesPlayed}</Text>
            <Text style={profileStyles.statLabel}>Games Played</Text>
          </View>
        </View>

        {/* Badges section */}
        {profileStats.badges.length > 0 && (
          <View style={profileStyles.badgesSection}>
            <Text style={profileStyles.sectionTitle}>BADGES</Text>
            <View style={profileStyles.badgesGrid}>
              {profileStats.badges.map((badge, idx) => (
                <View key={idx} style={profileStyles.badgeItem}>
                  <Text style={profileStyles.badgeItemEmoji}>{badge.emoji || '🏅'}</Text>
                  <Text style={profileStyles.badgeItemName}>{badge.name || badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={profileStyles.actionSection}>
          <TouchableOpacity style={profileStyles.actionBtn} onPress={() => onNavigate && onNavigate('leaderboard')} activeOpacity={0.8}>
            <Text style={profileStyles.actionBtnIcon}>🏆</Text>
            <Text style={profileStyles.actionBtnText}>Leaderboards</Text>
            <Text style={profileStyles.actionBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.actionBtn} onPress={() => onNavigate && onNavigate('crew')} activeOpacity={0.8}>
            <Text style={profileStyles.actionBtnIcon}>⚔️</Text>
            <Text style={profileStyles.actionBtnText}>My Crew</Text>
            <Text style={profileStyles.actionBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.actionBtn} onPress={() => onNavigate && onNavigate('missions')} activeOpacity={0.8}>
            <Text style={profileStyles.actionBtnIcon}>📋</Text>
            <Text style={profileStyles.actionBtnText}>Missions</Text>
            <Text style={profileStyles.actionBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.actionBtn} onPress={() => onNavigate && onNavigate('challenges')} activeOpacity={0.8}>
            <Text style={profileStyles.actionBtnIcon}>⚔️</Text>
            <Text style={profileStyles.actionBtnText}>Challenges {pendingChallenges > 0 ? `(${pendingChallenges})` : ''}</Text>
            {pendingChallenges > 0 && (
              <View style={profileStyles.challengeBadge}>
                <Text style={profileStyles.challengeBadgeText}>{pendingChallenges}</Text>
              </View>
            )}
            <Text style={profileStyles.actionBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.actionBtn} onPress={handleShareReferral} activeOpacity={0.8}>
            <Text style={profileStyles.actionBtnIcon}>🎁</Text>
            <Text style={profileStyles.actionBtnText}>Invite Friends {profileStats.referralCount > 0 ? `(${profileStats.referralCount})` : ''}</Text>
            <Text style={profileStyles.actionBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.proBtn} onPress={() => setShowProModal(true)} activeOpacity={0.85}>
            <Text style={profileStyles.proBtnText}>⭐ Go Pro</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={profileStyles.signOutBtn} onPress={onSignOut} activeOpacity={0.85}>
          <Text style={profileStyles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Go Pro Modal */}
      {showProModal && (
        <View style={profileStyles.proModalOverlay}>
          <View style={profileStyles.proModalSheet}>
            <Text style={profileStyles.proModalTitle}>CourtQuest Pro</Text>
            <Text style={profileStyles.proModalSub}>Unlock the full experience</Text>
            <View style={profileStyles.proFeature}>
              <Text style={profileStyles.proFeatureText}>✓  Unlimited video analyses per day</Text>
            </View>
            <View style={profileStyles.proFeature}>
              <Text style={profileStyles.proFeatureText}>✓  Exclusive Pro badges and flair</Text>
            </View>
            <View style={profileStyles.proFeature}>
              <Text style={profileStyles.proFeatureText}>✓  Priority crew matchmaking</Text>
            </View>
            <View style={profileStyles.proFeature}>
              <Text style={profileStyles.proFeatureText}>✓  Ad-free experience</Text>
            </View>
            <View style={profileStyles.proFeature}>
              <Text style={profileStyles.proFeatureText}>✓  2x XP weekends</Text>
            </View>
            <TouchableOpacity style={profileStyles.proSubscribeBtn} onPress={() => setShowProModal(false)} activeOpacity={0.85}>
              <Text style={profileStyles.proSubscribeBtnText}>Coming Soon</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProModal(false)} activeOpacity={0.7}>
              <Text style={profileStyles.proCloseText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const profileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  header: {
    paddingTop: Constants.statusBarHeight + 10,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,150,29,0.15)',
    backgroundColor: '#080F1E',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  scrollBody: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 28, paddingBottom: 20 },
  avatarWrapper: {
    width: 88, height: 88, marginBottom: 16,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: {
    width: 88, height: 88, borderRadius: 44,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 30 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#0C1A36',
    borderWidth: 2, borderColor: '#080F1E',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadgeText: { fontSize: 11, lineHeight: 13 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 8 },

  // Faction + Skill badges
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  factionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    borderWidth: 1,
  },
  factionBadgeEmoji: { fontSize: 14 },
  factionBadgeText: { fontSize: 12, fontWeight: '700' },
  skillBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  skillBadgeText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },

  // Crew banner
  crewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(245,150,29,0.1)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
    width: '100%', borderWidth: 1, borderColor: 'rgba(245,150,29,0.2)',
  },
  crewBannerEmoji: { fontSize: 18 },
  crewBannerText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#F5961D' },
  crewBannerArrow: { fontSize: 20, color: '#F5961D', fontWeight: '300' },

  statsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16, width: '100%',
  },
  statCard: {
    flex: 1, backgroundColor: '#0C1A36', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statNum: { fontSize: 22, fontWeight: '900', color: '#F5961D', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  // Badges section
  badgesSection: { width: '100%', marginTop: 12, marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#6B7280',
    letterSpacing: 2, marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  badgeItem: {
    backgroundColor: '#0C1A36', borderRadius: 12, padding: 12,
    alignItems: 'center', width: '30%', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeItemEmoji: { fontSize: 24, marginBottom: 4 },
  badgeItemName: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },

  // Action buttons
  actionSection: { width: '100%', marginTop: 12, marginBottom: 20, gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0C1A36', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
  actionBtnArrow: { fontSize: 22, color: '#6B7280', fontWeight: '300' },

  proBtn: {
    backgroundColor: 'rgba(245,150,29,0.12)', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(245,150,29,0.3)',
  },
  proBtnText: { color: '#F5961D', fontWeight: '800', fontSize: 16 },

  challengeBadge: {
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginRight: 4,
  },
  challengeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  signOutBtn: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  signOutBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 16 },

  // Go Pro Modal
  proModalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
    alignItems: 'center', padding: 28,
  },
  proModalSheet: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,150,29,0.3)',
  },
  proModalTitle: { fontSize: 24, fontWeight: '900', color: '#F5961D', marginBottom: 4 },
  proModalSub: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  proFeature: { marginBottom: 10, width: '100%' },
  proFeatureText: { fontSize: 14, color: '#D1D5DB', fontWeight: '600' },
  proSubscribeBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center', width: '100%', marginTop: 20,
  },
  proSubscribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  proCloseText: { color: '#6B7280', fontSize: 14, fontWeight: '600', marginTop: 16 },
});

const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'ME';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('courts');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(null); // null = loading, true/false
  const [subScreen, setSubScreen] = useState(null); // 'leaderboard' | 'crew' | 'missions' | null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        const userData = {
          uid: firebaseUser.uid,
          name: displayName,
          email: firebaseUser.email,
          initials: getInitials(displayName, firebaseUser.email),
        };

        // Write/merge profile doc to Firestore, then read back photoUri
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const profileData = {
          displayName,
          email: firebaseUser.email || '',
          lastLoginAt: serverTimestamp(),
        };
        // Check if doc exists to decide whether to set createdAt
        getDoc(userDocRef).then((snap) => {
          if (!snap.exists()) {
            profileData.createdAt = serverTimestamp();
            profileData.visitedCourts = [];
            profileData.favoriteCourts = [];
            profileData.xp = 0;
            profileData.currentStreak = 0;
            setOnboardingComplete(false);
          } else {
            // Restore persisted profile photo URL and onboarding status
            const existingData = snap.data();
            if (existingData.photoUri) {
              userData.photoUri = existingData.photoUri;
            }
            setOnboardingComplete(existingData.onboardingComplete === true);
          }
          setUser({ ...userData });
          setDoc(userDocRef, profileData, { merge: true })
            .then(() => checkAndUpdateStreak(firebaseUser.uid))
            .then(() => setupPushNotifications(firebaseUser.uid).catch(() => {}))
            .catch(() => {});
        }).catch(() => {
          setUser(userData);
          setOnboardingComplete(true); // Default to true on error
        });
      } else {
        setUser(null);
        setOnboardingComplete(null);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) {
    // Still checking persisted auth state
    return <View style={styles.root} />;
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <AuthScreen onLogin={(u) => setUser(u)} />
      </View>
    );
  }

  // Onboarding gate: show onboarding for first-time users
  if (onboardingComplete === false) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <OnboardingScreen
          user={user}
          onComplete={() => setOnboardingComplete(true)}
        />
      </View>
    );
  }

  // Sub-screens (full-screen overlays from profile actions)
  if (subScreen === 'leaderboard') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LeaderboardScreen user={user} onBack={() => setSubScreen(null)} />
      </View>
    );
  }
  if (subScreen === 'crew') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <CrewScreen user={user} onBack={() => setSubScreen(null)} />
      </View>
    );
  }
  if (subScreen === 'missions') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <MissionsScreen user={user} onBack={() => setSubScreen(null)} />
      </View>
    );
  }
  if (subScreen === 'challenges') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ChallengeScreen user={user} onBack={() => setSubScreen(null)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Screens */}
      <View style={styles.screen}>
        {activeTab === 'courts'    && <CourtsScreen user={user} />}
        {activeTab === 'control'   && <ControlScreen />}
        {activeTab === 'community' && <CommunityScreen user={user} />}
        {activeTab === 'mygame'    && <MyGameScreen user={user} />}
        {activeTab === 'profile'   && (
          <ProfileScreen
            user={user}
            onNavigate={(screen) => setSubScreen(screen)}
            onSignOut={async () => {
              await signOut(auth);
              setUser(null);
              setActiveTab('courts');
            }}
            onPhotoChange={async (localUri) => {
              // Show local preview immediately
              setUser(prev => ({ ...prev, photoUri: localUri }));
              if (!user?.uid) return;
              try {
                const response = await fetch(localUri);
                const blob = await response.blob();
                const storageRef = ref(storage, `profilePhotos/${user.uid}.jpg`);
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);
                // Persist download URL to Firestore and update state
                await setDoc(doc(db, 'users', user.uid), { photoUri: downloadURL }, { merge: true });
                setUser(prev => ({ ...prev, photoUri: downloadURL }));
              } catch (e) {
                console.warn('Photo upload failed:', e);
              }
            }}
          />
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                {tab.id === 'courts' ? (
                  <Image source={require('./assets/CourtQuestIcon.png')} style={{width:26,height:26,resizeMode:'contain'}} />
                ) : tab.id === 'control' ? (
                  <Image source={require('./assets/VersaProLogo.webp')} style={{width:28,height:28,resizeMode:'contain'}} />
                ) : tab.id === 'profile' ? (() => {
                  const colors = ['#F5961D','#4ADE80','#818CF8','#F472B6','#38BDF8'];
                  const avatarColor = colors[(user.name.charCodeAt(0)||0) % colors.length];
                  return user.photoUri ? (
                    <Image source={{uri: user.photoUri}} style={{width:28,height:28,borderRadius:14,resizeMode:'cover',borderWidth:active?2:0,borderColor:'#F5961D'}} />
                  ) : (
                    <View style={{width:28,height:28,borderRadius:14,backgroundColor:avatarColor,alignItems:'center',justifyContent:'center',borderWidth:active?2:0,borderColor:'#F5961D'}}>
                      <Text style={{color:'#fff',fontWeight:'800',fontSize:11}}>{user.initials}</Text>
                    </View>
                  );
                })() : (
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                )}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080F1E' },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0C1A36',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,150,29,0.15)',
    paddingBottom: 28,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 4,
  },
  tabIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(245,150,29,0.15)',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: {
    fontSize: 10, fontWeight: '600', color: '#6B7280',
  },
  tabLabelActive: {
    color: '#F5961D',
  },
});
