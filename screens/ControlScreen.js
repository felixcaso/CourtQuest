import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text,
  TouchableOpacity, ScrollView,
} from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PRESETS = {
  dink:  { speed: 20, spin: 10,  frequency: 5 },
  drive: { speed: 50, spin: 30,  frequency: 3 },
  lob:   { speed: 25, spin: -20, frequency: 6 },
  drop:  { speed: 18, spin: -10, frequency: 7 },
};

const DRILL_MODES = [
  { id: 'dink', label: 'Dinking', icon: '🎯' },
  { id: 'drive', label: 'Drives', icon: '💥' },
  { id: 'lob', label: 'Lobs', icon: '🌙' },
  { id: 'drop', label: 'Drop Shots', icon: '🪶' },
];

function SliderRow({ label, value, unit, min, max, onDecrease, onIncrease }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={sliderStyles.row}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{value}<Text style={sliderStyles.unit}> {unit}</Text></Text>
      </View>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
        <View style={[sliderStyles.thumb, { left: `${pct}%` }]} />
      </View>
      <View style={sliderStyles.btnRow}>
        <TouchableOpacity style={sliderStyles.btn} onPress={onDecrease}>
          <Text style={sliderStyles.btnText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sliderStyles.btn} onPress={onIncrease}>
          <Text style={sliderStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ControlScreen() {
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_PRESETS.dink.speed);
  const [frequency, setFrequency] = useState(DEFAULT_PRESETS.dink.frequency);
  const [spin, setSpin] = useState(DEFAULT_PRESETS.dink.spin);
  const [selectedDrill, setSelectedDrill] = useState('dink');
  const [userPresets, setUserPresets] = useState({...DEFAULT_PRESETS});
  const [presetModified, setPresetModified] = useState(false);

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const handleSelectDrill = (drillId) => {
    setSelectedDrill(drillId);
    const preset = userPresets[drillId];
    setSpeed(preset.speed);
    setSpin(preset.spin);
    setFrequency(preset.frequency);
    setPresetModified(false);
  };

  const handleSavePreset = () => {
    setUserPresets(prev => ({
      ...prev,
      [selectedDrill]: { speed, spin, frequency }
    }));
    setPresetModified(false);
  };

  useEffect(() => {
    const preset = userPresets[selectedDrill];
    if (preset && (speed !== preset.speed || spin !== preset.spin || frequency !== preset.frequency)) {
      setPresetModified(true);
    } else {
      setPresetModified(false);
    }
  }, [speed, spin, frequency, selectedDrill]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Machine Control</Text>
            <Text style={[styles.headerSub, connected && styles.headerSubConnected]}>
              {connected ? '● Connected' : '○ Not Connected'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.connectBtn, connected && styles.connectBtnActive]}
            onPress={() => { setConnected(!connected); if (connected) setRunning(false); }}
          >
            <Text style={[styles.connectBtnText, connected && styles.connectBtnTextActive]}>
              {connected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Coming Soon Banner */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>🔧</Text>
          <Text style={styles.comingSoonTitle}>Bluetooth Control Coming Soon</Text>
          <Text style={styles.comingSoonSub}>
            Full wireless control of your VersaPro machine is in development.
            This preview shows what's coming.
          </Text>
        </View>

        {/* Power Button */}
        <TouchableOpacity
          style={[styles.powerBtn, running && styles.powerBtnOn, !connected && styles.powerBtnDisabled]}
          onPress={() => connected && setRunning(!running)}
          activeOpacity={connected ? 0.8 : 1}
        >
          <Text style={styles.powerIcon}>{running ? '⏹' : '▶'}</Text>
          <Text style={styles.powerLabel}>{running ? 'Stop Machine' : 'Start Machine'}</Text>
        </TouchableOpacity>

        {/* Drill Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRILL MODE</Text>
          <View style={styles.drillGrid}>
            {DRILL_MODES.map(d => {
              const active = selectedDrill === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.drillCard, active && styles.drillCardActive]}
                  onPress={() => handleSelectDrill(d.id)}
                >
                  <View style={[styles.drillIconWrap, active && styles.drillIconWrapActive]}>
                    <Text style={styles.drillIcon}>{d.icon}</Text>
                  </View>
                  <Text style={[styles.drillLabel, active && styles.drillLabelActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.card}>
            <SliderRow
              label="Ball Speed"
              value={speed}
              unit="mph"
              min={10}
              max={60}
              onDecrease={() => setSpeed(v => clamp(v - 1, 10, 60))}
              onIncrease={() => setSpeed(v => clamp(v + 1, 10, 60))}
            />
            <View style={styles.divider} />
            <SliderRow
              label="Topspin"
              value={spin}
              unit="%"
              min={-100}
              max={100}
              onDecrease={() => setSpin(v => clamp(v - 10, -100, 100))}
              onIncrease={() => setSpin(v => clamp(v + 10, -100, 100))}
            />
            <View style={styles.divider} />
            <SliderRow
              label="Feed Rate"
              value={frequency}
              unit="sec"
              min={2}
              max={10}
              onDecrease={() => setFrequency(v => clamp(v - 1, 2, 10))}
              onIncrease={() => setFrequency(v => clamp(v + 1, 2, 10))}
            />
          </View>
        </View>

        {presetModified && (
          <View style={styles.savePresetBar}>
            <Text style={styles.savePresetText}>Preset modified</Text>
            <View style={styles.savePresetBtns}>
              <TouchableOpacity style={styles.savePresetReset} onPress={() => handleSelectDrill(selectedDrill)}>
                <Text style={styles.savePresetResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.savePresetSave} onPress={handleSavePreset}>
                <Text style={styles.savePresetSaveText}>Save as Preset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerSubConnected: { color: '#4ADE80' },
  connectBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  connectBtnActive: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.4)',
  },
  connectBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 13 },
  connectBtnTextActive: { color: '#4ADE80' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  powerBtn: {
    backgroundColor: '#0C1A36',
    borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 28,
    borderWidth: 2, borderColor: 'rgba(245,150,29,0.2)',
    flexDirection: 'row', justifyContent: 'center', gap: 12,
  },
  powerBtnOn: {
    backgroundColor: 'rgba(245,150,29,0.12)',
    borderColor: '#F5961D',
  },
  powerBtnDisabled: { opacity: 0.4 },
  powerIcon: { fontSize: 22 },
  powerLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#6B7280',
    letterSpacing: 2, marginBottom: 12,
  },
  drillGrid: { flexDirection: 'row', gap: 10 },
  drillCard: {
    flex: 1, backgroundColor: '#0C1A36', borderRadius: 16,
    padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
  },
  drillCardActive: {
    backgroundColor: 'rgba(245,150,29,0.12)',
    borderColor: '#F5961D',
  },
  drillIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  drillIconWrapActive: {
    backgroundColor: 'rgba(245,150,29,0.15)',
  },
  drillIcon: { fontSize: 22 },
  drillLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'center' },
  drillLabelActive: { color: '#F5961D' },
  card: {
    backgroundColor: '#0C1A36', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },
  comingSoon: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonIcon: { fontSize: 32, marginBottom: 12 },
  comingSoonTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 8 },
  comingSoonSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  savePresetBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,150,29,0.08)',
    borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(245,150,29,0.25)',
  },
  savePresetText: { fontSize: 13, color: '#F5961D', fontWeight: '600' },
  savePresetBtns: { flexDirection: 'row', gap: 8 },
  savePresetReset: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  savePresetResetText: { color: '#9CA3AF', fontWeight: '700', fontSize: 13 },
  savePresetSave: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#F5961D',
  },
  savePresetSaveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

const sliderStyles = StyleSheet.create({
  row: { gap: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#fff' },
  value: { fontSize: 18, fontWeight: '800', color: '#F5961D' },
  unit: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  track: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, position: 'relative', overflow: 'visible',
  },
  fill: { height: 6, backgroundColor: '#F5961D', borderRadius: 3 },
  thumb: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F5961D', borderWidth: 3, borderColor: '#fff',
    position: 'absolute', top: -5, marginLeft: -8,
  },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,150,29,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#F5961D', fontWeight: '800', fontSize: 20, lineHeight: 22 },
});
