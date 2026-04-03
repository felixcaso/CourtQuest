import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc,
  arrayUnion, arrayRemove, serverTimestamp, increment, getDocs,
} from 'firebase/firestore';
import { awardXP } from '../services/xpService';
import { checkAndAwardBadges } from '../services/badgeService';

const FILTERS = ['All Posts', 'Need Player', 'Find Court', 'Schedule Game'];

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

export default function CommunityScreen({ user }) {
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All Posts');
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState('Need Player');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('');
  const [gameCourt, setGameCourt] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // { postId: true/false }
  const [commentTexts, setCommentTexts] = useState({}); // { postId: 'text' }
  const [comments, setComments] = useState({}); // { postId: [comments] }
  const [postingComment, setPostingComment] = useState(null);

  const toggleComments = async (postId) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanding }));
    if (isExpanding && !comments[postId]) {
      // Load comments
      try {
        const commentsQuery = query(
          collection(db, 'posts', postId, 'comments'),
          orderBy('timestamp', 'asc')
        );
        const snap = await getDocs(commentsQuery);
        setComments(prev => ({
          ...prev,
          [postId]: snap.docs.map(d => ({ id: d.id, ...d.data() })),
        }));
      } catch (e) {
        console.warn('Load comments error:', e);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const text = (commentTexts[postId] || '').trim();
    if (!text || !user?.uid) return;
    setPostingComment(postId);
    try {
      const commentData = {
        authorUid: user.uid,
        authorName: user.name || 'Anonymous',
        authorInitials: user.initials || 'AN',
        text,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      // Update local state
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { ...commentData, timestamp: new Date() }],
      }));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.warn('Comment error:', e);
    } finally {
      setPostingComment(null);
    }
  };

  // Real-time listener for posts collection
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(loaded);
    }, () => {});
    return unsub;
  }, []);

  const filtered = posts.filter(p => {
    if (activeFilter === 'All Posts') return true;
    return p.tag === activeFilter;
  });

  const toggleLike = async (postId) => {
    if (!user?.uid) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const alreadyLiked = (post.likes || []).includes(user.uid);
    try {
      await updateDoc(postRef, {
        likes: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handlePost = async () => {
    if (!newText.trim()) return;
    setPosting(true);
    try {
      const initials = user ? user.initials : 'ME';
      const authorName = user ? user.name : 'You';
      const postData = {
        authorUid: user?.uid || 'guest',
        authorName,
        authorInitials: initials,
        text: newText.trim(),
        tag: newTag,
        timestamp: serverTimestamp(),
        likes: [],
      };
      if (newTag === 'Schedule Game') {
        postData.gameDate = gameDate.trim() || '';
        postData.gameTime = gameTime.trim() || '';
        postData.gameCourt = gameCourt.trim() || '';
      }
      await addDoc(collection(db, 'posts'), postData);
      // Increment postsCount on user doc
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          postsCount: increment(1),
        }).catch(() => {});
        await awardXP(user.uid, 5, 'post').catch(() => {});
      }
      setNewText('');
      setNewTag('Need Player');
      setGameDate('');
      setGameTime('');
      setGameCourt('');
      setModalVisible(false);
    } catch (err) {
      console.error('Post error:', err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSub}>Find games & players near you</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.headerBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptySub}>Be the first to post!</Text>
          </View>
        )}
        {filtered.map(post => {
          const likesArray = post.likes || [];
          const liked = user?.uid ? likesArray.includes(user.uid) : false;
          const postName = post.authorName || post.name || 'Anonymous';
          const postInitials = post.authorInitials || post.initials || postName.slice(0, 2).toUpperCase();
          return (
            <View key={post.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(postName) }]}>
                  <Text style={styles.avatarText}>{postInitials}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName}>{postName}</Text>
                  <Text style={styles.cardTime}>{timeAgo(post.timestamp)}</Text>
                </View>
                <View style={[
                  styles.tagBadge,
                  post.tag === 'Need Player' ? styles.tagGreen
                    : post.tag === 'Schedule Game' ? styles.tagPurple
                    : styles.tagOrange,
                ]}>
                  <Text style={[
                    styles.tagBadgeText,
                    post.tag === 'Need Player' ? styles.tagGreenText
                      : post.tag === 'Schedule Game' ? styles.tagPurpleText
                      : styles.tagOrangeText,
                  ]}>
                    {post.tag}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardText}>{post.text}</Text>

              {/* Schedule Game info */}
              {post.tag === 'Schedule Game' && post.gameDate && (
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleInfoText}>📅 {post.gameDate}{post.gameTime ? ` at ${post.gameTime}` : ''}</Text>
                  {post.gameCourt && <Text style={styles.scheduleInfoText}>📍 {post.gameCourt}</Text>}
                </View>
              )}

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.likeBtn}
                  onPress={() => toggleLike(post.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
                  <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
                    {likesArray.length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentBtn}
                  onPress={() => toggleComments(post.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.commentIcon}>💬</Text>
                  <Text style={styles.commentCount}>
                    {(comments[post.id] || []).length || ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comments section */}
              {expandedComments[post.id] && (
                <View style={styles.commentsSection}>
                  {(comments[post.id] || []).map((comment, cidx) => (
                    <View key={comment.id || cidx} style={styles.commentRow}>
                      <View style={[styles.commentAvatar, { backgroundColor: getAvatarColor(comment.authorName) }]}>
                        <Text style={styles.commentAvatarText}>{comment.authorInitials || '??'}</Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#4B5563"
                      value={commentTexts[post.id] || ''}
                      onChangeText={(t) => setCommentTexts(prev => ({ ...prev, [post.id]: t }))}
                      returnKeyType="send"
                      onSubmitEditing={() => handleAddComment(post.id)}
                    />
                    <TouchableOpacity
                      style={styles.commentSendBtn}
                      onPress={() => handleAddComment(post.id)}
                      disabled={postingComment === post.id || !(commentTexts[post.id] || '').trim()}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.commentSendText}>
                        {postingComment === post.id ? '...' : '↑'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Floating compose button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* New Post Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Post</Text>

            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind? Looking for players, courts..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={4}
              value={newText}
              onChangeText={setNewText}
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Tag</Text>
            <View style={styles.tagSelector}>
              {['Need Player', 'Find Court', 'Schedule Game'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagOption, newTag === t && styles.tagOptionActive]}
                  onPress={() => setNewTag(t)}
                >
                  <Text style={[styles.tagOptionText, newTag === t && styles.tagOptionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Schedule Game fields */}
            {newTag === 'Schedule Game' && (
              <View style={styles.scheduleFields}>
                <TextInput
                  style={styles.scheduleInput}
                  placeholder="Date (e.g. Apr 5)"
                  placeholderTextColor="#4B5563"
                  value={gameDate}
                  onChangeText={setGameDate}
                />
                <TextInput
                  style={styles.scheduleInput}
                  placeholder="Time (e.g. 3:00 PM)"
                  placeholderTextColor="#4B5563"
                  value={gameTime}
                  onChangeText={setGameTime}
                />
                <TextInput
                  style={styles.scheduleInput}
                  placeholder="Court name"
                  placeholderTextColor="#4B5563"
                  value={gameCourt}
                  onChangeText={setGameCourt}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.postBtn, (!newText.trim() || posting) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!newText.trim() || posting}
              activeOpacity={0.85}
            >
              <Text style={styles.postBtnText}>{posting ? 'Posting...' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  safeHeader: { backgroundColor: '#080F1E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,150,29,0.15)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#F5961D', marginTop: 2 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnText: { fontSize: 18 },

  filterScroll: { backgroundColor: '#080F1E' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(245,150,29,0.15)',
    borderColor: '#F5961D',
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#F5961D' },

  feed: { flex: 1 },
  feedContent: { padding: 16, paddingBottom: 100, gap: 12 },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#6B7280' },

  card: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarPhoto: {
    width: 42, height: 42, borderRadius: 21, marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardTime: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  tagBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  tagGreen: { backgroundColor: 'rgba(74,222,128,0.12)' },
  tagOrange: { backgroundColor: 'rgba(245,150,29,0.12)' },
  tagBadgeText: { fontSize: 11, fontWeight: '700' },
  tagGreenText: { color: '#4ADE80' },
  tagOrangeText: { color: '#F5961D' },
  tagPurple: { backgroundColor: 'rgba(129,140,248,0.12)' },
  tagPurpleText: { color: '#818CF8' },

  cardText: { fontSize: 14, color: '#D1D5DB', lineHeight: 21, marginBottom: 14 },

  // Schedule Game info
  scheduleInfo: {
    backgroundColor: 'rgba(129,140,248,0.08)', borderRadius: 10,
    padding: 10, marginBottom: 12, gap: 4,
  },
  scheduleInfoText: { fontSize: 13, color: '#818CF8', fontWeight: '600' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeIcon: { fontSize: 16 },
  likeCount: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  likeCountActive: { color: '#F5961D' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentIcon: { fontSize: 14 },
  commentCount: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

  // Comments
  commentsSection: {
    marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  commentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10,
  },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  commentContent: { flex: 1 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#D1D5DB', lineHeight: 18 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
  },
  commentInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  commentSendBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5961D', alignItems: 'center', justifyContent: 'center',
  },
  commentSendText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F5961D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F5961D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },

  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    backgroundColor: '#0C1A36', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14,
    color: '#fff', fontSize: 15, lineHeight: 22,
    minHeight: 100, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', letterSpacing: 2, marginBottom: 10 },
  tagSelector: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  tagOption: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  tagOptionActive: {
    backgroundColor: 'rgba(245,150,29,0.12)',
    borderColor: '#F5961D',
  },
  tagOptionText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tagOptionTextActive: { color: '#F5961D' },

  // Schedule Game fields in modal
  scheduleFields: { gap: 10, marginBottom: 16 },
  scheduleInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  postBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
