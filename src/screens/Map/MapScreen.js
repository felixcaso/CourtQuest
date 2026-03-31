import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { MOCK_COURTS } from '../../constants/mockData';
import { useCourtStore } from '../../store/useCourtStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function MapScreen() {
  const [selectedCourt, setSelectedCourt] = useState(null);
  const { kingClaims, claimCourt } = useCourtStore();
  const { user } = useAuthStore();

  const handleClaim = (courtId) => {
    claimCourt(courtId, user?.name || 'You');
    setSelectedCourt(null);
  };

  const renderCourt = ({ item }) => {
    const king = kingClaims[item.id];
    return (
      <TouchableOpacity style={styles.courtCard} onPress={() => setSelectedCourt(item)}>
        <View style={styles.courtLeft}>
          <View style={styles.courtIconWrap}>
            <Ionicons name="location" size={20} color={COLORS.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.courtName}>{item.name}</Text>
            <Text style={styles.courtAddress}>{item.address}</Text>
            <View style={styles.courtMeta}>
              <Text style={styles.courtTag}>{item.indoor ? 'Indoor' : 'Outdoor'}</Text>
              <Text style={styles.courtTag}>{item.courts} courts</Text>
            </View>
          </View>
        </View>
        <View style={styles.courtRight}>
          {king ? (
            <View style={styles.kingBadge}>
              <Text style={styles.crownEmoji}>👑</Text>
              <Text style={styles.kingName}>{king}</Text>
            </View>
          ) : (
            <View style={styles.noKingBadge}>
              <Text style={styles.noKingText}>No King</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courts Near You</Text>
        <Text style={styles.headerSub}>New York City</Text>
      </View>

      <FlatList
        data={MOCK_COURTS}
        keyExtractor={(item) => item.id}
        renderItem={renderCourt}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedCourt} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedCourt(null)} />
        {selectedCourt && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedCourt.name}</Text>
            <Text style={styles.sheetAddress}>{selectedCourt.address}</Text>
            <View style={styles.sheetRow}>
              <View style={styles.sheetTag}>
                <Ionicons name={selectedCourt.indoor ? 'business' : 'sunny'} size={14} color={COLORS.orange} />
                <Text style={styles.sheetTagText}>{selectedCourt.indoor ? 'Indoor' : 'Outdoor'}</Text>
              </View>
              <View style={styles.sheetTag}>
                <Ionicons name="grid" size={14} color={COLORS.orange} />
                <Text style={styles.sheetTagText}>{selectedCourt.courts} Courts</Text>
              </View>
            </View>
            <View style={styles.kingSection}>
              <Text style={styles.kingLabel}>King of the Court</Text>
              {kingClaims[selectedCourt.id] ? (
                <View style={styles.kingRow}>
                  <Text style={styles.crownLarge}>👑</Text>
                  <Text style={styles.kingNameLarge}>{kingClaims[selectedCourt.id]}</Text>
                </View>
              ) : (
                <Text style={styles.noKingLarge}>No one has claimed this court yet</Text>
              )}
            </View>
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(selectedCourt.id)}>
                <Ionicons name="trophy" size={16} color="#fff" />
                <Text style={styles.claimBtnText}>Claim Court</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.challengeBtn}>
                <Ionicons name="flash" size={16} color={COLORS.orange} />
                <Text style={styles.challengeBtnText}>Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  list: { padding: 16, gap: 12 },
  courtCard: {
    backgroundColor: COLORS.navy, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  courtLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  courtIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(245,150,29,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  courtName: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  courtAddress: { fontSize: 12, color: COLORS.gray, marginBottom: 6 },
  courtMeta: { flexDirection: 'row', gap: 6 },
  courtTag: {
    fontSize: 11, color: COLORS.orange,
    backgroundColor: 'rgba(245,150,29,0.1)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100,
  },
  courtRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  kingBadge: { alignItems: 'center' },
  crownEmoji: { fontSize: 16 },
  kingName: { fontSize: 10, color: COLORS.orange, fontWeight: '600' },
  noKingBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  noKingText: { fontSize: 10, color: COLORS.gray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    backgroundColor: COLORS.navy, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  sheetAddress: { fontSize: 13, color: COLORS.gray, marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  sheetTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,150,29,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  sheetTagText: { fontSize: 13, color: COLORS.orange, fontWeight: '600' },
  kingSection: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 16, marginBottom: 20,
  },
  kingLabel: { fontSize: 11, color: COLORS.gray, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  kingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crownLarge: { fontSize: 28 },
  kingNameLarge: { fontSize: 18, fontWeight: '800', color: COLORS.orange },
  noKingLarge: { fontSize: 14, color: COLORS.gray },
  sheetButtons: { flexDirection: 'row', gap: 12 },
  claimBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.orange, borderRadius: 12, padding: 14,
  },
  claimBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  challengeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.orange, borderRadius: 12, padding: 14,
  },
  challengeBtnText: { color: COLORS.orange, fontWeight: '700', fontSize: 15 },
});
