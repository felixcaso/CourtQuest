import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { getTodayMissions, claimMissionReward } from '../services/missionService';
import { checkAndAwardBadges } from '../services/badgeService';

export default function MissionsScreen({ user, onBack }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    loadMissions();
  }, [user?.uid]);

  const loadMissions = async () => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const todayMissions = await getTodayMissions(user.uid);
      setMissions(todayMissions);
    } catch (e) {
      console.warn('Mission load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (mission) => {
    if (!user?.uid || !mission.completed || mission.claimed) return;
    setClaimingId(mission.id);
    try {
      const success = await claimMissionReward(user.uid, mission.id);
      if (success) {
        setMissions(prev => prev.map(m =>
          m.id === mission.id ? { ...m, claimed: true } : m
        ));
        // Check for badge unlocks after XP award
        await checkAndAwardBadges(user.uid).catch(() => {});
      }
    } catch (e) {
      console.warn('Claim error:', e);
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Missions</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Progress summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBarOuter}>
            <View style={[
              styles.progressBarInner,
              { width: missions.length > 0 ? `${(completedCount / missions.length) * 100}%` : '0%' }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{missions.length} missions completed
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading missions...</Text>
          </View>
        ) : missions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Missions Available</Text>
            <Text style={styles.emptySub}>Check back tomorrow for new daily missions!</Text>
          </View>
        ) : (
          missions.map((mission) => {
            const progressPercent = mission.target > 0
              ? Math.min((mission.progress / mission.target) * 100, 100)
              : 0;

            return (
              <View key={mission.id} style={[
                styles.missionCard,
                mission.completed && styles.missionCardComplete,
              ]}>
                <View style={styles.missionHeader}>
                  <View style={styles.missionIconWrap}>
                    <Text style={styles.missionIcon}>{mission.icon || '📋'}</Text>
                  </View>
                  <View style={styles.missionInfo}>
                    <Text style={styles.missionTitle}>{mission.title}</Text>
                    <Text style={styles.missionDesc}>{mission.description}</Text>
                  </View>
                  <View style={styles.missionXP}>
                    <Text style={styles.missionXPText}>+{mission.xpReward}</Text>
                    <Text style={styles.missionXPLabel}>XP</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.missionProgressOuter}>
                  <View style={[
                    styles.missionProgressInner,
                    { width: `${progressPercent}%` },
                    mission.completed && styles.missionProgressComplete,
                  ]} />
                </View>
                <Text style={styles.missionProgressText}>
                  {mission.progress}/{mission.target}
                  {mission.completed && !mission.claimed && ' - Complete!'}
                  {mission.claimed && ' - Claimed!'}
                </Text>

                {/* Claim button */}
                {mission.completed && !mission.claimed && (
                  <TouchableOpacity
                    style={styles.claimBtn}
                    onPress={() => handleClaim(mission)}
                    disabled={claimingId === mission.id}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.claimBtnText}>
                      {claimingId === mission.id ? 'Claiming...' : `Claim +${mission.xpReward} XP`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  safe: { backgroundColor: '#080F1E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,150,29,0.15)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#F5961D' },
  scrollPad: { padding: 20, paddingBottom: 60 },
  centered: { alignItems: 'center', paddingTop: 40 },
  loadingText: { fontSize: 16, color: '#6B7280' },

  // Progress card
  progressCard: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245,150,29,0.2)',
  },
  progressTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12 },
  progressBarOuter: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4,
    marginBottom: 8, overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%', backgroundColor: '#F5961D', borderRadius: 4,
  },
  progressText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  // Empty state
  emptyCard: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 36,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },

  // Mission card
  missionCard: {
    backgroundColor: '#0C1A36', borderRadius: 18, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  missionCardComplete: {
    borderColor: 'rgba(74,222,128,0.3)',
  },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  missionIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  missionIcon: { fontSize: 20 },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  missionDesc: { fontSize: 12, color: '#9CA3AF' },
  missionXP: { alignItems: 'center' },
  missionXPText: { fontSize: 16, fontWeight: '900', color: '#F5961D' },
  missionXPLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700' },

  // Progress
  missionProgressOuter: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3,
    overflow: 'hidden', marginBottom: 6,
  },
  missionProgressInner: {
    height: '100%', backgroundColor: '#F5961D', borderRadius: 3,
  },
  missionProgressComplete: { backgroundColor: '#4ADE80' },
  missionProgressText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  // Claim
  claimBtn: {
    backgroundColor: '#4ADE80', borderRadius: 12, padding: 12,
    alignItems: 'center', marginTop: 10,
  },
  claimBtnText: { color: '#080F1E', fontWeight: '800', fontSize: 14 },
});
