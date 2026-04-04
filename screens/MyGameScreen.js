// TODO: Move GEMINI_API_KEY to a .env file or Firebase Remote Config before production
// For now, user must add their Gemini API key here

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { awardXP } from '../services/xpService';
import Constants from 'expo-constants';

const GEMINI_API_KEY = 'AIzaSyC4CG71e0ALP5ZtaccMJVT-wtDXSFKNMRM';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  footwork: 'Footwork',
  swingMechanics: 'Swing Mechanics',
  courtPositioning: 'Court Positioning',
  strategyAndShotSelection: 'Strategy & Shot Selection',
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const scoreDiff = (current, previous, key) => {
  if (!previous || !previous.categories || !current || !current.categories) return null;
  const diff = (current.categories[key]?.score ?? 0) - (previous.categories[key]?.score ?? 0);
  return diff;
};

// ─── Extract frames from video ───────────────────────────────────────────────

const extractFrames = async (videoUri, durationMs) => {
  // Sample 8 evenly spaced frames across the video
  const count = 8;
  const interval = Math.floor(durationMs / (count + 1));
  const frames = [];

  for (let i = 1; i <= count; i++) {
    const timeMs = interval * i;
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeMs,
        quality: 0.7,
      });
      frames.push(uri);
    } catch (_) {
      // Skip frames that fail
    }
  }

  if (frames.length === 0) throw new Error('Could not extract frames from video.');
  return frames;
};

// ─── Convert frame URIs to base64 inline parts ───────────────────────────────

const framesToInlineParts = async (frameUris) => {
  const parts = [];
  for (const uri of frameUris) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
    // Clean up frame file
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
  return parts;
};

// ─── Analyze frames with Gemini Vision ───────────────────────────────────────

const analyzeFrames = async (frameParts) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert pickleball coach. I'm giving you ${frameParts.length} frames sampled from a video of a player playing pickleball. Analyze their technique across these frames.

Provide structured feedback in the following JSON format ONLY (no markdown, no extra text):
{
  "overallScore": <number 1-10>,
  "categories": {
    "footwork": {
      "score": <number 1-10>,
      "summary": "<one sentence>",
      "feedback": "<2-3 sentences of specific actionable feedback>"
    },
    "swingMechanics": {
      "score": <number 1-10>,
      "summary": "<one sentence>",
      "feedback": "<2-3 sentences of specific actionable feedback>"
    },
    "courtPositioning": {
      "score": <number 1-10>,
      "summary": "<one sentence>",
      "feedback": "<2-3 sentences of specific actionable feedback>"
    },
    "strategyAndShotSelection": {
      "score": <number 1-10>,
      "summary": "<one sentence>",
      "feedback": "<2-3 sentences of specific actionable feedback>"
    }
  },
  "overallFeedback": "<3-4 sentences overall coaching summary>"
}`;

  const result = await model.generateContent([...frameParts, prompt]);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
};

// ─── Firestore helpers ───────────────────────────────────────────────────────

const saveAnalysis = async (userId, analysisData) => {
  await addDoc(collection(db, 'users', userId, 'analyses'), {
    ...analysisData,
    createdAt: new Date(),
  });
};

const loadPastSessions = async (userId) => {
  const q = query(
    collection(db, 'users', userId, 'analyses'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScorePill({ label, score }) {
  return (
    <View style={pillStyles.pill}>
      <Text style={pillStyles.label}>{label}</Text>
      <Text style={pillStyles.score}>{score}/10</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(245,150,29,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,150,29,0.25)',
  },
  label: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 1 },
  score: { fontSize: 13, fontWeight: '800', color: '#F5961D' },
});

function CategoryCard({ catKey, data, comparison }) {
  const [expanded, setExpanded] = useState(false);
  const diff = comparison ? scoreDiff(comparison.current, comparison.previous, catKey) : null;

  return (
    <TouchableOpacity
      style={catCardStyles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={catCardStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={catCardStyles.label}>{CATEGORY_LABELS[catKey]}</Text>
          <Text style={catCardStyles.summary}>{data.summary}</Text>
        </View>
        <View style={catCardStyles.scoreWrap}>
          <Text style={catCardStyles.score}>{data.score}</Text>
          <Text style={catCardStyles.scoreOf}>/10</Text>
        </View>
      </View>

      {diff !== null && diff !== 0 && (
        <View style={[catCardStyles.diffBadge, diff > 0 ? catCardStyles.diffUp : catCardStyles.diffDown]}>
          <Text style={[catCardStyles.diffText, diff > 0 ? catCardStyles.diffTextUp : catCardStyles.diffTextDown]}>
            {diff > 0 ? `↑ +${diff.toFixed(1)}` : `↓ ${diff.toFixed(1)}`} vs last session
          </Text>
        </View>
      )}

      {expanded && (
        <Text style={catCardStyles.feedback}>{data.feedback}</Text>
      )}
      <Text style={catCardStyles.expandHint}>{expanded ? 'Tap to collapse' : 'Tap for details'}</Text>
    </TouchableOpacity>
  );
}

const catCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0C1A36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 3 },
  summary: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  scoreWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  score: { fontSize: 26, fontWeight: '900', color: '#F5961D', lineHeight: 28 },
  scoreOf: { fontSize: 13, color: '#6B7280', marginBottom: 3, marginLeft: 2 },
  feedback: { fontSize: 13, color: '#D1D5DB', lineHeight: 19, marginTop: 12 },
  expandHint: { fontSize: 10, color: '#4B5563', marginTop: 8, textAlign: 'right' },
  diffBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffUp: { backgroundColor: 'rgba(74,222,128,0.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  diffDown: { backgroundColor: 'rgba(248,113,113,0.12)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  diffText: { fontSize: 11, fontWeight: '700' },
  diffTextUp: { color: '#4ADE80' },
  diffTextDown: { color: '#F87171' },
});

function PastSessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={histStyles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={histStyles.topRow}>
        <Text style={histStyles.date}>{formatDate(session.createdAt)}</Text>
        <View style={histStyles.overallScore}>
          <Text style={histStyles.overallNum}>{session.overallScore?.toFixed(1)}</Text>
          <Text style={histStyles.overallOf}>/10</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
            <ScorePill key={k} label={label} score={session.categories?.[k]?.score ?? '—'} />
          ))}
        </View>
      </ScrollView>

      {expanded && session.overallFeedback && (
        <Text style={histStyles.feedback}>{session.overallFeedback}</Text>
      )}
      <Text style={histStyles.hint}>{expanded ? 'Tap to collapse' : 'Tap to expand'}</Text>
    </TouchableOpacity>
  );
}

const histStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0C1A36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  overallScore: { flexDirection: 'row', alignItems: 'flex-end' },
  overallNum: { fontSize: 22, fontWeight: '900', color: '#F5961D', lineHeight: 24 },
  overallOf: { fontSize: 12, color: '#6B7280', marginBottom: 2, marginLeft: 2 },
  feedback: { fontSize: 13, color: '#D1D5DB', lineHeight: 19, marginTop: 12 },
  hint: { fontSize: 10, color: '#4B5563', marginTop: 8, textAlign: 'right' },
});

// ─── Analyzing Overlay ───────────────────────────────────────────────────────

function AnalyzingOverlay({ progressText }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={overlayStyles.card}>
      <Animated.View style={[overlayStyles.pulseCircle, { transform: [{ scale: pulse }] }]}>
        <Text style={overlayStyles.pulseIcon}>📊</Text>
      </Animated.View>
      <Text style={overlayStyles.progressText}>{progressText}</Text>
      <Text style={overlayStyles.subText}>
        Don't close the app — this takes about 30–60 seconds
      </Text>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0C1A36',
    borderRadius: 24,
    padding: 40,
    marginHorizontal: 20,
    marginTop: 60,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245,150,29,0.3)',
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#F5961D',
  },
  pulseIcon: { fontSize: 36 },
  progressText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MyGameScreen({ user }) {
  const [screenState, setScreenState] = useState('idle'); // 'idle' | 'analyzing' | 'results'
  const [progressText, setProgressText] = useState('Uploading your video...');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [previousSession, setPreviousSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadPastSessions(user.uid)
        .then((sessions) => {
          setPastSessions(sessions);
          if (sessions.length > 0) setPreviousSession(sessions[0]);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleUploadVideo = async () => {
    try {
      setError(null);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Media library permission is required to upload a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoMaxDuration: 90,
        quality: 0.8,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const videoUri = asset.uri;
      const durationMs = asset.duration ? asset.duration * 1000 : 30000;

      setScreenState('analyzing');
      setProgressText('Extracting frames...');

      // Step 1: Extract 8 frames from the video
      const frameUris = await extractFrames(videoUri, durationMs);

      setProgressText('Analyzing your technique...');

      // Step 2: Convert frames to base64 inline parts
      const frameParts = await framesToInlineParts(frameUris);

      // Step 3: Analyze with Gemini Vision
      const analysis = await analyzeFrames(frameParts);

      // Step 4: Save to Firestore + award XP
      if (user?.uid) {
        await saveAnalysis(user.uid, analysis);
        await updateDoc(doc(db, 'users', user.uid), { gamesPlayed: increment(1) }).catch(() => {});
        await awardXP(user.uid, 25, 'video_analysis').catch(() => {});
      }

      // Step 5: Refresh sessions
      if (user?.uid) {
        const sessions = await loadPastSessions(user.uid);
        setPastSessions(sessions);
        if (sessions.length > 1) setPreviousSession(sessions[1]);
      }

      setAnalysisResult(analysis);
      setScreenState('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreenState('idle');
    }
  };

  // ── ANALYZING STATE ───────────────────────────────────────────────────────
  if (screenState === 'analyzing') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My Game</Text>
          </View>
        <AnalyzingOverlay progressText={progressText} />
      </View>
    );
  }

  // ── RESULTS STATE ─────────────────────────────────────────────────────────
  if (screenState === 'results' && analysisResult) {
    const comparison = previousSession
      ? { current: analysisResult, previous: previousSession }
      : null;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My Game</Text>
          </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Score */}
          <View style={resultsStyles.overallCard}>
            <Text style={resultsStyles.overallLabel}>OVERALL SCORE</Text>
            <View style={resultsStyles.overallScoreRow}>
              <Text style={resultsStyles.overallScore}>
                {analysisResult.overallScore?.toFixed(1)}
              </Text>
              <Text style={resultsStyles.overallOf}> / 10</Text>
            </View>
            {analysisResult.overallFeedback && (
              <Text style={resultsStyles.overallFeedback}>
                {analysisResult.overallFeedback}
              </Text>
            )}
          </View>

          {/* Category Cards */}
          <Text style={styles.sectionTitle}>CATEGORY BREAKDOWN</Text>
          {Object.keys(CATEGORY_LABELS).map((key) => (
            <CategoryCard
              key={key}
              catKey={key}
              data={analysisResult.categories[key]}
              comparison={comparison}
            />
          ))}

          {/* Comparison to last session */}
          {comparison && (
            <>
              <Text style={styles.sectionTitle}>VS LAST SESSION</Text>
              <View style={resultsStyles.comparisonCard}>
                {Object.keys(CATEGORY_LABELS).map((key) => {
                  const diff = scoreDiff(comparison.current, comparison.previous, key);
                  if (diff === null) return null;
                  const improved = diff > 0;
                  const same = diff === 0;
                  return (
                    <View key={key} style={resultsStyles.compRow}>
                      <Text style={resultsStyles.compLabel}>{CATEGORY_LABELS[key]}</Text>
                      {same ? (
                        <Text style={resultsStyles.compSame}>— No change</Text>
                      ) : (
                        <Text
                          style={[
                            resultsStyles.compDiff,
                            improved ? resultsStyles.compUp : resultsStyles.compDown,
                          ]}
                        >
                          {improved ? `↑ +${diff.toFixed(1)}` : `↓ ${diff.toFixed(1)}`}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Upload New Video */}
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadVideo} activeOpacity={0.85}>
            <Text style={styles.uploadBtnText}>Upload New Video</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── IDLE STATE ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
            <Text style={styles.headerTitle}>My Game</Text>
          </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Upload card */}
        <View style={idleStyles.uploadCard}>
          <View style={idleStyles.videoIconWrap}>
            <Text style={idleStyles.videoIcon}>🎬</Text>
          </View>
          <Text style={idleStyles.uploadTitle}>Upload a clip to get feedback</Text>
          <Text style={idleStyles.uploadSub}>
            Max 90 seconds · Your video is analyzed then deleted
          </Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadVideo} activeOpacity={0.85}>
            <Text style={styles.uploadBtnText}>Upload Video</Text>
          </TouchableOpacity>
        </View>

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>PAST SESSIONS</Text>
            {pastSessions.map((session) => (
              <PastSessionCard key={session.id} session={session} />
            ))}
          </>
        )}

        {pastSessions.length === 0 && (
          <View style={idleStyles.emptyHistory}>
            <Text style={idleStyles.emptyHistoryIcon}>📋</Text>
            <Text style={idleStyles.emptyHistoryText}>
              No sessions yet — upload your first clip to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Constants.statusBarHeight + 10,
    backgroundColor: '#080F1E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,150,29,0.15)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },
  uploadBtn: {
    backgroundColor: '#F5961D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '600', lineHeight: 19 },
});

const idleStyles = StyleSheet.create({
  uploadCard: {
    backgroundColor: '#0C1A36',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  videoIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,150,29,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245,150,29,0.3)',
  },
  videoIcon: { fontSize: 34 },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyHistory: {
    backgroundColor: '#0C1A36',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyHistoryIcon: { fontSize: 28, marginBottom: 12 },
  emptyHistoryText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
});

const resultsStyles = StyleSheet.create({
  overallCard: {
    backgroundColor: '#0C1A36',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(245,150,29,0.25)',
  },
  overallLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 8,
  },
  overallScoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  overallScore: { fontSize: 64, fontWeight: '900', color: '#F5961D', lineHeight: 70 },
  overallOf: { fontSize: 22, color: '#6B7280', marginBottom: 10, fontWeight: '700' },
  overallFeedback: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 21,
  },
  comparisonCard: {
    backgroundColor: '#0C1A36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  compLabel: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  compDiff: { fontSize: 14, fontWeight: '800' },
  compUp: { color: '#4ADE80' },
  compDown: { color: '#F87171' },
  compSame: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
});
