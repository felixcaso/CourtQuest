import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MOCK_LEADERBOARD } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/fonts';

const TABS = ['Court', 'City', 'National'];

function PlayerRow({ player, rank }) {
  const isFirst = rank === 1;

  return (
    <View style={[styles.row, isFirst && styles.rowFirst]}>
      <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
        <Text style={[styles.rankText, isFirst && styles.rankTextFirst]}>
          {isFirst ? '👑' : rank}
        </Text>
      </View>

      <View style={[styles.avatar, isFirst && styles.avatarFirst]}>
        <Text style={[styles.avatarText, isFirst && styles.avatarTextFirst]}>
          {player.name.charAt(0)}
        </Text>
      </View>

      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, isFirst && styles.playerNameFirst]}>
          {player.name}
        </Text>
        <Text style={styles.courtName}>{player.courtName}</Text>
      </View>

      <View style={styles.statsCol}>
        <Text style={[styles.wins, isFirst && styles.winsFirst]}>{player.wins}W</Text>
        <Text style={styles.losses}>{player.losses}L</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState('Court');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top players this season</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={MOCK_LEADERBOARD}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <PlayerRow player={item} rank={index + 1} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: COLORS.navy,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerSub: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.dark,
  },
  tabActive: {
    backgroundColor: COLORS.orange,
  },
  tabText: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  rowFirst: {
    borderColor: COLORS.orange,
    backgroundColor: '#1A2A14',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: 'transparent',
  },
  rankText: {
    color: COLORS.grayLight,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  rankTextFirst: {
    fontSize: FONT_SIZES.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFirst: {
    backgroundColor: COLORS.orange,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
  avatarTextFirst: {
    color: COLORS.dark,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  playerNameFirst: {
    color: COLORS.orange,
    fontWeight: FONT_WEIGHTS.bold,
  },
  courtName: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  statsCol: {
    alignItems: 'flex-end',
  },
  wins: {
    color: COLORS.grayLight,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
  winsFirst: {
    color: COLORS.orange,
  },
  losses: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.xs,
  },
});
