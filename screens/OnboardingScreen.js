import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import Constants from 'expo-constants';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const FACTIONS = [
  {
    id: 'pickle_purists',
    name: 'Pickle Purists',
    emoji: '🥒',
    color: '#4ADE80',
    description: 'Pickleball is the future. Fast rallies, kitchen battles, and dinking mastery.',
  },
  {
    id: 'tennis_traditionalists',
    name: 'Tennis Traditionalists',
    emoji: '🎾',
    color: '#F5961D',
    description: 'The OG racquet sport. Powerful serves, baseline rallies, and net charges.',
  },
  {
    id: 'paddle_peacemakers',
    name: 'Paddle Peacemakers',
    emoji: '🏓',
    color: '#818CF8',
    description: 'Why choose? You play it all — paddle tennis, platform tennis, and beyond.',
  },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', emoji: '🔥' },
  { id: 'advanced', label: 'Advanced', emoji: '🏆' },
];

const TUTORIAL_STEPS = [
  {
    title: 'Visit Courts',
    description: 'Walk to any of the 25 NYC courts on the map. You auto-check-in when you\'re within 200m and earn XP.',
    icon: '📍',
  },
  {
    title: 'Claim Your Throne',
    description: 'Be the first to claim an unclaimed court and become King of the Court. Earn 50 XP per claim.',
    icon: '👑',
  },
  {
    title: 'Level Up & Compete',
    description: 'Complete daily missions, earn badges, join a crew, and climb the leaderboards.',
    icon: '🚀',
  },
];

export default function OnboardingScreen({ user, onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=faction, 2=skill, 3=tutorial, 4=done
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user?.uid || !selectedFaction) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        sportAllegiance: selectedFaction,
        skillLevel: selectedSkill || 'beginner',
        onboardingComplete: true,
      }, { merge: true });
      onComplete();
    } catch (e) {
      console.warn('Onboarding save error:', e);
      // Still proceed even if save fails
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollCenter} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeIconWrap}>
              <Text style={styles.welcomeIcon}>🏓</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome to CourtQuest</Text>
            <Text style={styles.welcomeSub}>
              The MMO for racquet sport players. Claim courts, join crews, complete missions, and dominate the leaderboards.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Step 1: Pick faction
  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
            <Text style={styles.stepTitle}>Choose Your Allegiance</Text>
            <Text style={styles.stepSub}>This shapes your identity in CourtQuest. Choose wisely.</Text>

            {FACTIONS.map((faction) => (
              <TouchableOpacity
                key={faction.id}
                style={[
                  styles.factionCard,
                  selectedFaction === faction.id && { borderColor: faction.color, borderWidth: 2 },
                ]}
                onPress={() => setSelectedFaction(faction.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.factionIconWrap, { backgroundColor: faction.color + '20' }]}>
                  <Text style={styles.factionEmoji}>{faction.emoji}</Text>
                </View>
                <Text style={[styles.factionName, { color: faction.color }]}>{faction.name}</Text>
                <Text style={styles.factionDesc}>{faction.description}</Text>
                {selectedFaction === faction.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: faction.color + '20', borderColor: faction.color }]}>
                    <Text style={[styles.selectedBadgeText, { color: faction.color }]}>Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, !selectedFaction && styles.btnDisabled]}
              onPress={() => selectedFaction && setStep(2)}
              disabled={!selectedFaction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Step 2: Skill level
  if (step === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
            <Text style={styles.stepTitle}>Your Skill Level</Text>
            <Text style={styles.stepSub}>Be honest -- this helps match you with the right players.</Text>

            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.skillCard,
                  selectedSkill === level.id && styles.skillCardSelected,
                ]}
                onPress={() => setSelectedSkill(level.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.skillEmoji}>{level.emoji}</Text>
                <Text style={styles.skillLabel}>{level.label}</Text>
                {selectedSkill === level.id && (
                  <Text style={styles.skillCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, !selectedSkill && styles.btnDisabled]}
              onPress={() => selectedSkill && setStep(3)}
              disabled={!selectedSkill}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Step 3: Tutorial
  if (step === 3) {
    return (
      <View style={styles.container}>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
            <Text style={styles.stepTitle}>How CourtQuest Works</Text>

            {TUTORIAL_STEPS.map((item, index) => (
              <View key={index} style={styles.tutorialCard}>
                <View style={styles.tutorialIconWrap}>
                  <Text style={styles.tutorialIcon}>{item.icon}</Text>
                </View>
                <View style={styles.tutorialContent}>
                  <Text style={styles.tutorialTitle}>{item.title}</Text>
                  <Text style={styles.tutorialDesc}>{item.description}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleFinish}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {saving ? 'Setting up...' : 'Enter CourtQuest'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  safe: { flex: 1 },
  scrollCenter: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 48,
    paddingTop: Constants.statusBarHeight + 10,
  },
  scrollPad: {
    paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 60,
    paddingTop: Constants.statusBarHeight + 10,
  },

  // Welcome
  welcomeIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32, borderWidth: 2, borderColor: 'rgba(245,150,29,0.3)',
  },
  welcomeIcon: { fontSize: 48 },
  welcomeTitle: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    textAlign: 'center', marginBottom: 16,
  },
  welcomeSub: {
    fontSize: 16, color: '#9CA3AF', textAlign: 'center',
    lineHeight: 24, marginBottom: 40, paddingHorizontal: 8,
  },

  // Steps
  stepLabel: {
    fontSize: 11, fontWeight: '800', color: '#F5961D',
    letterSpacing: 2, marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8,
  },
  stepSub: {
    fontSize: 14, color: '#9CA3AF', lineHeight: 21, marginBottom: 28,
  },

  // Faction cards
  factionCard: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 20,
    marginBottom: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
  },
  factionIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  factionEmoji: { fontSize: 24 },
  factionName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  factionDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 19 },
  selectedBadge: {
    marginTop: 10, alignSelf: 'flex-start',
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1,
  },
  selectedBadgeText: { fontSize: 12, fontWeight: '700' },

  // Skill cards
  skillCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0C1A36', borderRadius: 16, padding: 18,
    marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
  },
  skillCardSelected: {
    borderColor: '#F5961D', backgroundColor: 'rgba(245,150,29,0.08)',
  },
  skillEmoji: { fontSize: 24, marginRight: 14 },
  skillLabel: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  skillCheck: { fontSize: 18, color: '#F5961D', fontWeight: '800' },

  // Tutorial
  tutorialCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#0C1A36', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tutorialIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  tutorialIcon: { fontSize: 22 },
  tutorialContent: { flex: 1 },
  tutorialTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  tutorialDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 19 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 20, width: '100%',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.4 },
});
