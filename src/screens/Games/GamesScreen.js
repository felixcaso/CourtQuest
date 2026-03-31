import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../../store/useGameStore';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/fonts';

const SKILL_COLORS = {
  Beginner: '#22C55E',
  Intermediate: '#F59E0B',
  Advanced: '#EF4444',
};

function GameCard({ game, onJoin }) {
  const isFull = game.players >= game.maxPlayers;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{game.name}</Text>
        <View
          style={[
            styles.skillBadge,
            { backgroundColor: SKILL_COLORS[game.skillLevel] + '22' },
          ]}
        >
          <Text
            style={[styles.skillText, { color: SKILL_COLORS[game.skillLevel] }]}
          >
            {game.skillLevel}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.grayLight} />
        <Text style={styles.cardMeta}>{game.court}</Text>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.grayLight} />
        <Text style={styles.cardMeta}>
          {game.date} at {game.time}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.playersRow}>
          <Ionicons name="people-outline" size={16} color={COLORS.orange} />
          <Text style={styles.playersText}>
            {game.players}/{game.maxPlayers} players
          </Text>
          <View style={styles.spotsBar}>
            {Array.from({ length: game.maxPlayers }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.spot,
                  { backgroundColor: i < game.players ? COLORS.orange : COLORS.border },
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, isFull && styles.joinBtnFull]}
          onPress={() => !isFull && onJoin(game.id)}
          disabled={isFull}
        >
          <Text style={[styles.joinBtnText, isFull && styles.joinBtnTextFull]}>
            {isFull ? 'Full' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GamesScreen() {
  const games = useGameStore((s) => s.games);
  const joinGame = useGameStore((s) => s.joinGame);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nearby Games</Text>
          <Text style={styles.headerSub}>{games.length} games available</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GameCard game={item} onJoin={joinGame} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    backgroundColor: COLORS.orange,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    flex: 1,
    marginRight: 8,
  },
  skillBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  cardMeta: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playersText: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
  },
  spotsBar: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 4,
  },
  spot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  joinBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  joinBtnFull: {
    backgroundColor: COLORS.border,
  },
  joinBtnText: {
    color: COLORS.dark,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  joinBtnTextFull: {
    color: COLORS.grayLight,
  },
});
