import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const AVATAR_COLORS = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];
function getAvatarColor(name) {
  return AVATAR_COLORS[((name || '').charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardScreen({ user, onBack }) {
  const [tab, setTab] = useState('players'); // 'players' | 'crews'
  const [players, setPlayers] = useState([]);
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      // Load top 50 players by XP
      const playersQuery = query(
        collection(db, 'users'),
        orderBy('xp', 'desc'),
        limit(50)
      );
      const playersSnap = await getDocs(playersQuery);
      const playerList = playersSnap.docs.map((d, idx) => ({
        id: d.id,
        rank: idx + 1,
        ...d.data(),
      }));
      setPlayers(playerList);

      // Find current user's rank
      if (user?.uid) {
        const userIdx = playerList.findIndex(p => p.id === user.uid);
        setUserRank(userIdx >= 0 ? userIdx + 1 : null);
      }

      // Load top 50 crews by totalXP
      const crewsQuery = query(
        collection(db, 'crews'),
        orderBy('totalXP', 'desc'),
        limit(50)
      );
      const crewsSnap = await getDocs(crewsQuery);
      const crewList = crewsSnap.docs.map((d, idx) => ({
        id: d.id,
        rank: idx + 1,
        ...d.data(),
      }));
      setCrews(crewList);
    } catch (e) {
      console.warn('Leaderboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboards</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'players' && styles.tabBtnActive]}
          onPress={() => setTab('players')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'players' && styles.tabBtnTextActive]}>
            Players
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'crews' && styles.tabBtnActive]}
          onPress={() => setTab('crews')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, tab === 'crews' && styles.tabBtnTextActive]}>
            Crews
          </Text>
        </TouchableOpacity>
      </View>

      {/* User rank banner */}
      {tab === 'players' && userRank && (
        <View style={styles.userRankBanner}>
          <Text style={styles.userRankText}>Your Rank: #{userRank}</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading leaderboards...</Text>
          </View>
        ) : tab === 'players' ? (
          players.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No Rankings Yet</Text>
              <Text style={styles.emptySub}>Be the first to earn XP and claim the top spot!</Text>
            </View>
          ) : (
            players.map((player) => {
              const isCurrentUser = player.id === user?.uid;
              const displayName = player.displayName || 'Unknown';
              const initials = displayName.slice(0, 2).toUpperCase();
              const xp = player.xp || 0;
              const level = Math.floor(xp / 100) + 1;

              return (
                <View key={player.id} style={[
                  styles.rankRow,
                  isCurrentUser && styles.rankRowHighlight,
                ]}>
                  <Text style={styles.rankNum}>
                    {RANK_MEDALS[player.rank] || `#${player.rank}`}
                  </Text>
                  <View style={[styles.rankAvatar, { backgroundColor: getAvatarColor(displayName) }]}>
                    <Text style={styles.rankAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankName, isCurrentUser && styles.rankNameHighlight]}>
                      {displayName} {isCurrentUser ? '(You)' : ''}
                    </Text>
                    <Text style={styles.rankSub}>Level {level}</Text>
                  </View>
                  <Text style={styles.rankXP}>{xp} XP</Text>
                </View>
              );
            })
          )
        ) : (
          crews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>⚔️</Text>
              <Text style={styles.emptyTitle}>No Crews Yet</Text>
              <Text style={styles.emptySub}>Create a crew and start climbing the ranks!</Text>
            </View>
          ) : (
            crews.map((crew) => (
              <View key={crew.id} style={styles.rankRow}>
                <Text style={styles.rankNum}>
                  {RANK_MEDALS[crew.rank] || `#${crew.rank}`}
                </Text>
                <View style={[styles.rankAvatar, { backgroundColor: '#F5961D' }]}>
                  <Text style={styles.rankAvatarText}>⚔️</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{crew.name || 'Unknown Crew'}</Text>
                  <Text style={styles.rankSub}>{crew.memberCount || 0} members</Text>
                </View>
                <Text style={styles.rankXP}>{crew.totalXP || 0} XP</Text>
              </View>
            ))
          )
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

  // Tabs
  tabRow: {
    flexDirection: 'row', padding: 12, paddingBottom: 0, gap: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(245,150,29,0.15)', borderColor: '#F5961D',
  },
  tabBtnText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  tabBtnTextActive: { color: '#F5961D' },

  // User rank
  userRankBanner: {
    backgroundColor: 'rgba(245,150,29,0.1)', marginHorizontal: 12,
    marginTop: 12, borderRadius: 10, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(245,150,29,0.2)',
  },
  userRankText: { fontSize: 14, fontWeight: '700', color: '#F5961D' },

  scrollPad: { padding: 12, paddingBottom: 60 },
  centered: { alignItems: 'center', paddingTop: 40 },
  loadingText: { fontSize: 16, color: '#6B7280' },

  // Empty
  emptyCard: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 36,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },

  // Rank rows
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0C1A36', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rankRowHighlight: {
    borderColor: 'rgba(245,150,29,0.4)', backgroundColor: 'rgba(245,150,29,0.06)',
  },
  rankNum: { fontSize: 16, fontWeight: '900', color: '#F5961D', width: 36, textAlign: 'center' },
  rankAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  rankAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  rankNameHighlight: { color: '#F5961D' },
  rankSub: { fontSize: 12, color: '#6B7280' },
  rankXP: { fontSize: 15, fontWeight: '800', color: '#F5961D' },
});
