import React, { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';

const SAMPLE_POSTS = [
  {
    id: '1',
    name: 'Marcus Rivera',
    initials: 'MR',
    avatarColor: '#F5961D',
    time: '2m ago',
    text: 'Anyone down for a casual game at Central Park this afternoon around 3pm? Looking for 2 more players, all skill levels welcome!',
    tag: 'Need Player',
    likes: 14,
  },
  {
    id: '2',
    name: 'Sarah Kim',
    initials: 'SK',
    avatarColor: '#4ADE80',
    time: '18m ago',
    text: 'Does anyone know if the courts at Queensbridge are open today? The website is down and I can\'t find any info.',
    tag: 'Find Court',
    likes: 5,
  },
  {
    id: '3',
    name: 'Danny Torres',
    initials: 'DT',
    avatarColor: '#818CF8',
    time: '1h ago',
    text: 'Just got back from East River Park — courts are in great shape and barely anyone there on weekday mornings. Highly recommend!',
    tag: 'Find Court',
    likes: 23,
  },
  {
    id: '4',
    name: 'Priya Nair',
    initials: 'PN',
    avatarColor: '#F472B6',
    time: '3h ago',
    text: 'Intermediate player here looking for a regular Tuesday/Thursday hitting partner in Brooklyn. Prospect Park area preferred. DM me!',
    tag: 'Need Player',
    likes: 9,
  },
];

const FILTERS = ['All Posts', 'Need Player', 'Find Court'];

export default function CommunityScreen({ user }) {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [activeFilter, setActiveFilter] = useState('All Posts');
  const [likedIds, setLikedIds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState('Need Player');
  const [posting, setPosting] = useState(false);

  const filtered = posts.filter(p => {
    if (activeFilter === 'All Posts') return true;
    return p.tag === activeFilter;
  });

  const toggleLike = (id) => {
    setLikedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, likes: likedIds.includes(id) ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handlePost = () => {
    if (!newText.trim()) return;
    setPosting(true);
    setTimeout(() => {
      const initials = user
        ? user.initials
        : 'ME';
      const name = user ? user.name : 'You';
      const newPost = {
        id: Date.now().toString(),
        name,
        initials,
        avatarColor: '#F5961D',
        photoUri: user ? user.photoUri : null,
        time: 'just now',
        text: newText.trim(),
        tag: newTag,
        likes: 0,
      };
      setPosts(prev => [newPost, ...prev]);
      setNewText('');
      setNewTag('Need Player');
      setPosting(false);
      setModalVisible(false);
    }, 600);
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
          const liked = likedIds.includes(post.id);
          return (
            <View key={post.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {post.photoUri ? (
                  <Image source={{ uri: post.photoUri }} style={styles.avatarPhoto} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
                    <Text style={styles.avatarText}>{post.initials}</Text>
                  </View>
                )}
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName}>{post.name}</Text>
                  <Text style={styles.cardTime}>{post.time}</Text>
                </View>
                <View style={[
                  styles.tagBadge,
                  post.tag === 'Need Player' ? styles.tagGreen : styles.tagOrange,
                ]}>
                  <Text style={[
                    styles.tagBadgeText,
                    post.tag === 'Need Player' ? styles.tagGreenText : styles.tagOrangeText,
                  ]}>
                    {post.tag}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardText}>{post.text}</Text>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.likeBtn}
                  onPress={() => toggleLike(post.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.likeIcon}>{liked ? '❤️' : '🤍'}</Text>
                  <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
                    {post.likes}
                  </Text>
                </TouchableOpacity>
              </View>
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
              {['Need Player', 'Find Court'].map(t => (
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

  cardText: { fontSize: 14, color: '#D1D5DB', lineHeight: 21, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeIcon: { fontSize: 16 },
  likeCount: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  likeCountActive: { color: '#F5961D' },

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
  tagSelector: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  tagOption: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
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
  postBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
