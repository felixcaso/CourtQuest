import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView,
  TextInput, Alert, Share,
} from 'react-native';
import { createCrew, joinCrew, leaveCrew, getCrewDetails, getCrewMembers } from '../services/crewService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AVATAR_COLORS = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];
function getAvatarColor(name) {
  return AVATAR_COLORS[((name || '').charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function CrewScreen({ user, onBack }) {
  const [crewId, setCrewId] = useState(null);
  const [crewData, setCrewData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('view'); // 'view' | 'create' | 'join'
  const [crewName, setCrewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCrewData();
  }, [user?.uid]);

  const loadCrewData = async () => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists() && userSnap.data().crewId) {
        const id = userSnap.data().crewId;
        setCrewId(id);
        const details = await getCrewDetails(id);
        setCrewData(details);
        const memberList = await getCrewMembers(id);
        setMembers(memberList);
      } else {
        setCrewId(null);
        setCrewData(null);
        setMembers([]);
      }
    } catch (e) {
      console.warn('Crew load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!crewName.trim()) return;
    setActionLoading(true);
    try {
      const result = await createCrew(user.uid, crewName.trim());
      setCrewName('');
      setMode('view');
      await loadCrewData();
      Alert.alert('Crew Created!', `Share your join code: ${result.joinCode}`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not create crew');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setActionLoading(true);
    try {
      await joinCrew(user.uid, joinCode.trim());
      setJoinCode('');
      setMode('view');
      await loadCrewData();
      Alert.alert('Joined!', 'You are now part of the crew');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not join crew');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Leave Crew', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await leaveCrew(user.uid);
            setCrewId(null);
            setCrewData(null);
            setMembers([]);
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not leave crew');
          } finally {
            setActionLoading(false);
          }
        }
      },
    ]);
  };

  const handleShareCode = () => {
    if (!crewData?.joinCode) return;
    Share.share({
      message: `Join my crew "${crewData.name}" on CourtQuest! Use code: ${crewData.joinCode}`,
    }).catch(() => {});
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Crew</Text>
            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // No crew — show create/join
  if (!crewId) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Crew</Text>
            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⚔️</Text>
            <Text style={styles.emptyTitle}>No Crew Yet</Text>
            <Text style={styles.emptySub}>Create your own crew or join an existing one with a code.</Text>
          </View>

          {mode === 'create' ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create a Crew</Text>
              <TextInput
                style={styles.input}
                placeholder="Crew name"
                placeholderTextColor="#4B5563"
                value={crewName}
                onChangeText={setCrewName}
                autoCapitalize="words"
                maxLength={30}
              />
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('view')} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, (!crewName.trim() || actionLoading) && styles.btnDisabled]}
                  onPress={handleCreate}
                  disabled={!crewName.trim() || actionLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>{actionLoading ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : mode === 'join' ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Join a Crew</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter join code"
                placeholderTextColor="#4B5563"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={10}
              />
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('view')} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, (!joinCode.trim() || actionLoading) && styles.btnDisabled]}
                  onPress={handleJoin}
                  disabled={!joinCode.trim() || actionLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>{actionLoading ? 'Joining...' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('create')} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Create a Crew</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('join')} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Join with Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Has crew — show details
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Crew</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Crew header */}
        <View style={styles.crewHeaderCard}>
          <Text style={styles.crewEmoji}>⚔️</Text>
          <Text style={styles.crewNameLarge}>{crewData?.name || 'My Crew'}</Text>
          <TouchableOpacity onPress={handleShareCode} activeOpacity={0.7}>
            <Text style={styles.crewCode}>Code: {crewData?.joinCode || '---'} (tap to share)</Text>
          </TouchableOpacity>
        </View>

        {/* Crew stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{crewData?.totalXP || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{members.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{crewData?.courtsControlled || 0}</Text>
            <Text style={styles.statLabel}>Courts</Text>
          </View>
        </View>

        {/* Members roster */}
        <Text style={styles.sectionTitle}>ROSTER</Text>
        {members.map((member, idx) => (
          <View key={member.uid || idx} style={styles.memberRow}>
            <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor(member.displayName) }]}>
              <Text style={styles.memberAvatarText}>
                {(member.displayName || '??').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.displayName}
                {member.uid === crewData?.creatorUid ? ' (Leader)' : ''}
              </Text>
              <Text style={styles.memberStats}>
                Lvl {member.level || 1} · {member.xp || 0} XP · {member.courtsClaimed || 0} Courts
              </Text>
            </View>
            <Text style={styles.memberRank}>#{idx + 1}</Text>
          </View>
        ))}

        {/* Leave crew */}
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
          <Text style={styles.leaveBtnText}>Leave Crew</Text>
        </TouchableOpacity>

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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  scrollPad: { padding: 20, paddingBottom: 60 },

  // Empty state
  emptyCard: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 36,
    alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },

  // Action buttons
  actionBtns: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#F5961D', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#F5961D', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  secondaryBtnText: { color: '#F5961D', fontWeight: '800', fontSize: 16 },

  // Form
  formCard: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    padding: 14, color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
  },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 15 },
  confirmBtn: {
    flex: 1, backgroundColor: '#F5961D', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },

  // Crew view
  crewHeaderCard: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(245,150,29,0.25)',
  },
  crewEmoji: { fontSize: 40, marginBottom: 12 },
  crewNameLarge: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  crewCode: { fontSize: 13, color: '#F5961D', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#0C1A36', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statNum: { fontSize: 22, fontWeight: '900', color: '#F5961D', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#6B7280',
    letterSpacing: 2, marginBottom: 12,
  },

  // Members
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0C1A36', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  memberStats: { fontSize: 12, color: '#6B7280' },
  memberRank: { fontSize: 16, fontWeight: '800', color: '#F5961D' },

  leaveBtn: {
    marginTop: 24, borderRadius: 14, padding: 16, alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  leaveBtnText: { color: '#F87171', fontWeight: '700', fontSize: 15 },
});
