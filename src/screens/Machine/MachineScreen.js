import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/fonts';

function LockedSlider({ label, value }) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={styles.sliderThumb} />
      </View>
      <Text style={styles.sliderValue}>{value}</Text>
    </View>
  );
}

function LockedToggle({ label }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Switch value={false} disabled onValueChange={() => {}} trackColor={{ false: COLORS.border }} />
    </View>
  );
}

export default function MachineScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Machine Control</Text>
        <Text style={styles.headerSub}>VersaPro Pitching Machine</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconArea}>
          <View style={styles.iconCircle}>
            <Ionicons name="settings-outline" size={56} color={COLORS.orange} />
          </View>
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.description}>
            Connect and control your VersaPro pitching machine. Available when VersaPro releases
            Bluetooth-enabled hardware.
          </Text>
        </View>

        <View style={styles.mockPanel}>
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={32} color={COLORS.grayLight} />
            <Text style={styles.lockText}>Hardware Not Connected</Text>
          </View>

          <View style={styles.mockContent} pointerEvents="none">
            <Text style={styles.panelTitle}>Machine Settings</Text>
            <LockedSlider label="Ball Speed" value={65} />
            <LockedSlider label="Feed Rate" value={40} />
            <LockedToggle label="Topspin" />
            <LockedToggle label="Backspin" />
            <LockedSlider label="Oscillation" value={30} />
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  iconArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.navy,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoon: {
    color: COLORS.orange,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: 10,
  },
  description: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  mockPanel: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,15,30,0.75)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  lockText: {
    color: COLORS.grayLight,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  mockContent: {
    padding: 20,
    opacity: 0.4,
  },
  panelTitle: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.lg,
    marginBottom: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sliderLabel: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    width: 90,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFill: {
    height: 6,
    backgroundColor: COLORS.orange,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    left: '60%',
  },
  sliderValue: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    width: 28,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
