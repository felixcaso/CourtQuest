import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import {
  getChallengesForUser, getChallengeHistory,
  acceptChallenge, declineChallenge,
  reportResult, confirmResult, disputeResult,
} from '../services/challengeService';

const TABS = ['Active', 'Pending', 'History'];

const AVATAR_COLORS = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];
function getAvatarColor(name) {
  return AVATAR_COLORS[((name || '').charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ChallengeScreen({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [historyChallenges, setHistoryChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // challengeId being acted on
  const [reportModal, setReportModal] = useState(null); // challenge object for reporting

  const uid = user?.uid;

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getChallengesForUser(uid),
        getChallengeHistory(uid),
      ]);
      setActiveChallenges(active);
      setHistoryChallenges(history);
    } catch (e) {
      console.warn('Load challenges error:', e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived lists
  const activeList = activeChallenges.filter(
    c => c.status === 'in_progress' || c.status === 'awaiting_confirmation'
  );
  const pendingList = activeChallenges.filter(c => c.status === 'pending');

  // Helpers
  const getOpponentName = (c) => {
    return c.challengerUid === uid ? c.targetName : c.challengerName;
  };
  const getOpponentUid = (c) => {
    return c.challengerUid === uid ? c.targetUid : c.challengerUid;
  };
  const isIncoming = (c) => c.targetUid === uid;

  // Actions
  const handleAccept = async (challengeId) => {
    setActionLoading(challengeId);
    try {
      await acceptChallenge(challengeId, uid);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (challengeId) => {
    setActionLoading(challengeId);
    try {
      await declineChallenge(challengeId, uid);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportWinner = async (challenge, winnerUid) => {
    setReportModal(null);
    setActionLoading(challenge.id);
    try {
      await reportResult(challenge.id, winnerUid, uid);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (challengeId) => {
    setActionLoading(challengeId);
    try {
      await confirmResult(challengeId, uid);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispute = async (challengeId) => {
    setActionLoading(challengeId);
    try {
      await disputeResult(challengeId, uid);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Compute W/L record from history
  const wins = historyChallenges.filter(c => c.winnerUid === uid).length;
  const losses = historyChallenges.filter(c => c.loserUid === uid).length;

  const renderChallengeCard = (challenge, type) => {
    const opponent = getOpponentName(challenge);
    const opponentInitials = (opponent || '').slice(0, 2).toUpperCase();
    const incoming = isIncoming(challenge);
    const isLoading = actionLoading === challenge.id;

    // Status display
    let statusText = '';
    let statusColor = '#6B7280';
    switch (challenge.status) {
      case 'pending':
        statusText = incoming ? 'Incoming Challenge' : 'Waiting for response...';
        statusColor = incoming ? '#F5961D' : '#6B7280';
        break;
      case 'in_progress':
        statusText = 'In Progress';
        statusColor = '#4ADE80';
        break;
      case 'awaiting_confirmation':
        if (challenge.reportedBy === uid) {
          statusText = 'Awaiting opponent confirmation';
          statusColor = '#F5961D';
        } else {
          statusText = 'Confirm result?';
          statusColor = '#F5961D';
        }
        break;
      case 'completed':
        statusText = challenge.winnerUid === uid ? 'Won' : 'Lost';
        statusColor = challenge.winnerUid === uid ? '#F5961D' : '#EF4444';
        break;
      case 'declined':
        statusText = 'Declined';
        statusColor = '#EF4444';
        break;
      default:
        statusText = challenge.status;
    }

    return (
      <View key={challenge.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(opponent) }]}>
            <Text style={styles.avatarText}>{opponentInitials}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{opponent}</Text>
            <Text style={styles.cardTime}>{timeAgo(challenge.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Court info */}
        {challenge.courtName && (
          <View style={styles.courtRow}>
            <Text style={styles.courtIcon}>📍</Text>
            <Text style={styles.courtName}>{challenge.courtName}</Text>
          </View>
        )}

        {/* Action buttons based on status */}
        {type === 'pending' && incoming && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(challenge.id)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptBtnText}>{isLoading ? '...' : 'Accept'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleDecline(challenge.id)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.declineBtnText}>{isLoading ? '...' : 'Decline'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {type === 'active' && challenge.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportModal(challenge)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.reportBtnText}>{isLoading ? '...' : 'Report Result'}</Text>
          </TouchableOpacity>
        )}

        {type === 'active' && challenge.status === 'awaiting_confirmation' && challenge.reportedBy !== uid && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmQuestion}>
              {challenge.reportedWinner === uid
                ? `${getOpponentName(challenge)} says you won. Confirm?`
                : `${getOpponentName(challenge)} says they won. Confirm?`}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleConfirm(challenge.id)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptBtnText}>{isLoading ? '...' : 'Confirm'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleDispute(challenge.id)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.declineBtnText}>{isLoading ? '...' : 'Dispute'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {type === 'active' && challenge.status === 'awaiting_confirmation' && challenge.reportedBy === uid && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>Waiting for {getOpponentName(challenge)} to confirm...</Text>
          </View>
        )}

        {/* History result indicator */}
        {type === 'history' && challenge.status === 'completed' && (
          <View style={[styles.resultBadge, challenge.winnerUid === uid ? styles.resultWin : styles.resultLoss]}>
            <Text style={[styles.resultBadgeText, challenge.winnerUid === uid ? styles.resultWinText : styles.resultLossText]}>
              {challenge.winnerUid === uid ? 'W' : 'L'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backBtn}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenges</Text>
          <View style={{ width: 60 }} />
        </View>

      {/* W/L Record */}
      <View style={styles.recordRow}>
        <View style={styles.recordCard}>
          <Text style={styles.recordNum}>{wins}</Text>
          <Text style={styles.recordLabel}>Wins</Text>
        </View>
        <View style={styles.recordCard}>
          <Text style={[styles.recordNum, { color: '#EF4444' }]}>{losses}</Text>
          <Text style={styles.recordLabel}>Losses</Text>
        </View>
        <View style={styles.recordCard}>
          <Text style={styles.recordNum}>{wins + losses}</Text>
          <Text style={styles.recordLabel}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
              {tab === 'Pending' && pendingList.length > 0 ? ` (${pendingList.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#F5961D" size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'Active' && (
            activeList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{'<<'}</Text>
                <Text style={styles.emptyText}>No active challenges</Text>
                <Text style={styles.emptySub}>Challenge someone from the Courts map or Community!</Text>
              </View>
            ) : (
              activeList.map(c => renderChallengeCard(c, 'active'))
            )
          )}
          {activeTab === 'Pending' && (
            pendingList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{'<<'}</Text>
                <Text style={styles.emptyText}>No pending challenges</Text>
                <Text style={styles.emptySub}>Send a challenge to get started!</Text>
              </View>
            ) : (
              pendingList.map(c => renderChallengeCard(c, 'pending'))
            )
          )}
          {activeTab === 'History' && (
            historyChallenges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{'<<'}</Text>
                <Text style={styles.emptyText}>No challenge history</Text>
                <Text style={styles.emptySub}>Complete a challenge to see your record!</Text>
              </View>
            ) : (
              historyChallenges.map(c => renderChallengeCard(c, 'history'))
            )
          )}
        </ScrollView>
      )}

      {/* Report Result Modal */}
      <Modal visible={!!reportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Report Result</Text>
            <Text style={styles.modalSub}>
              Who won the match against {reportModal ? getOpponentName(reportModal) : ''}?
            </Text>

            <TouchableOpacity
              style={styles.modalOptionBtn}
              onPress={() => reportModal && handleReportWinner(reportModal, uid)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOptionEmoji}>{'<<'}</Text>
              <Text style={styles.modalOptionText}>I Won</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOptionBtn, styles.modalOptionBtnSecondary]}
              onPress={() => reportModal && handleReportWinner(reportModal, getOpponentUid(reportModal))}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOptionEmoji}>{'<<'}</Text>
              <Text style={[styles.modalOptionText, { color: '#9CA3AF' }]}>
                {reportModal ? getOpponentName(reportModal) : 'Opponent'} Won
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setReportModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingTop: Constants.statusBarHeight + 10,
    backgroundColor: '#080F1E',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,150,29,0.15)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  backBtn: { fontSize: 16, fontWeight: '600', color: '#F5961D' },

  // W/L Record
  recordRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16,
  },
  recordCard: {
    flex: 1, backgroundColor: '#0C1A36', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  recordNum: { fontSize: 24, fontWeight: '900', color: '#F5961D', marginBottom: 2 },
  recordLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  // Tabs
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: 'rgba(245,150,29,0.15)',
    borderColor: '#F5961D',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#F5961D' },

  // Feed
  feed: { flex: 1 },
  feedContent: { padding: 16, paddingBottom: 40, gap: 12 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, color: '#4B5563', marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30 },

  // Challenge card
  card: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardTime: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  // Court info
  courtRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  courtIcon: { fontSize: 13 },
  courtName: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  acceptBtn: {
    flex: 1, backgroundColor: '#F5961D', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  declineBtn: {
    flex: 1, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  declineBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  // Report button
  reportBtn: {
    backgroundColor: 'rgba(245,150,29,0.12)', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(245,150,29,0.3)',
  },
  reportBtnText: { color: '#F5961D', fontWeight: '800', fontSize: 14 },

  // Confirm section
  confirmSection: { marginTop: 4 },
  confirmQuestion: { fontSize: 13, color: '#D1D5DB', marginBottom: 10, lineHeight: 18 },

  // Waiting box
  waitingBox: {
    backgroundColor: 'rgba(245,150,29,0.06)', borderRadius: 10,
    padding: 12, marginTop: 4, alignItems: 'center',
  },
  waitingText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },

  // History result badge
  resultBadge: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  resultWin: { backgroundColor: 'rgba(245,150,29,0.15)' },
  resultLoss: { backgroundColor: 'rgba(239,68,68,0.12)' },
  resultBadgeText: { fontSize: 14, fontWeight: '900' },
  resultWinText: { color: '#F5961D' },
  resultLossText: { color: '#EF4444' },

  // Report Result Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  modalSheet: {
    backgroundColor: '#0C1A36', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,150,29,0.3)',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  modalSub: { fontSize: 14, color: '#9CA3AF', marginBottom: 24, textAlign: 'center' },
  modalOptionBtn: {
    width: '100%', backgroundColor: 'rgba(245,150,29,0.12)',
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,150,29,0.3)',
    marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  modalOptionBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalOptionEmoji: { fontSize: 18, color: '#6B7280' },
  modalOptionText: { fontSize: 16, fontWeight: '700', color: '#F5961D' },
  modalCancelBtn: { marginTop: 12 },
  modalCancelText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
