import React, { useState } from 'react';
import {
  StyleSheet, View, Text, Modal,
  TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

const COURTS = [
  {
    id: '1',
    name: 'Central Park Pickleball Courts',
    address: 'Central Park, New York, NY 10024',
    courts: 4,
    indoor: false,
    lat: 40.7812,
    lng: -73.9665,
  },
  {
    id: '2',
    name: 'Queensbridge Park',
    address: '40-20 21st St, Long Island City, NY 11101',
    courts: 6,
    indoor: false,
    lat: 40.7549,
    lng: -73.9458,
  },
  {
    id: '3',
    name: 'East River Park',
    address: 'FDR Dr & Delancey St, New York, NY 10002',
    courts: 4,
    indoor: false,
    lat: 40.7133,
    lng: -73.9731,
  },
  {
    id: '4',
    name: 'Flushing Meadows Corona Park',
    address: 'Flushing Meadows Corona Park, Queens, NY 11368',
    courts: 8,
    indoor: false,
    lat: 40.7282,
    lng: -73.8418,
  },
  {
    id: '5',
    name: 'Prospect Park Pickleball',
    address: 'Prospect Park, Brooklyn, NY 11215',
    courts: 4,
    indoor: false,
    lat: 40.6602,
    lng: -73.9690,
  },
  {
    id: '6',
    name: 'McCarren Park',
    address: 'Driggs Ave & N 12th St, Brooklyn, NY 11222',
    courts: 3,
    indoor: false,
    lat: 40.7208,
    lng: -73.9516,
  },
  {
    id: '7',
    name: 'Inwood Hill Park',
    address: 'Inwood Hill Park, New York, NY 10034',
    courts: 2,
    indoor: false,
    lat: 40.8681,
    lng: -73.9244,
  },
  {
    id: '8',
    name: 'Riverside Park (96th St)',
    address: 'Riverside Park, New York, NY 10025',
    courts: 2,
    indoor: false,
    lat: 40.7938,
    lng: -73.9732,
  },
  {
    id: '9',
    name: 'Alley Pond Park',
    address: 'Alley Pond Park, Queens, NY 11364',
    courts: 3,
    indoor: false,
    lat: 40.7380,
    lng: -73.7529,
  },
  {
    id: '10',
    name: 'Silver Lake Park',
    address: 'Silver Lake Park, Staten Island, NY 10301',
    courts: 2,
    indoor: false,
    lat: 40.6282,
    lng: -74.0901,
  },
];

const NYC_REGION = {
  latitude: 40.7282,
  longitude: -73.9442,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={NYC_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {COURTS.map((court) => (
          <Marker
            key={court.id}
            coordinate={{ latitude: court.lat, longitude: court.lng }}
            pinColor="#F5961D"
            onPress={() => setSelected(court)}
          />
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerWrap} pointerEvents="none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CourtQuest</Text>
          <Text style={styles.headerSub}>{COURTS.length} courts in NYC</Text>
        </View>
      </SafeAreaView>

      {/* Court detail bottom sheet */}
      <Modal visible={!!selected} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        />
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetName}>{selected.name}</Text>
            <Text style={styles.sheetAddr}>{selected.address}</Text>
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>🏓 {selected.courts} Courts</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selected.indoor ? '🏢 Indoor' : '☀️ Outdoor'}</Text>
              </View>
            </View>
            <View style={styles.kingBox}>
              <Text style={styles.kingLabel}>KING OF THE COURT</Text>
              <Text style={styles.kingEmpty}>No one has claimed this court yet</Text>
            </View>
            <TouchableOpacity style={styles.claimBtn} onPress={() => setSelected(null)}>
              <Text style={styles.claimBtnText}>👑  Claim This Court</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  map: { flex: 1 },
  headerWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  header: {
    backgroundColor: 'rgba(8,15,30,0.85)',
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,150,29,0.25)',
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
  },
  headerSub: { fontSize: 13, color: '#F5961D', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#0C1A36',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48,
  },
  handle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sheetAddr: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: 'rgba(245,150,29,0.12)',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
  },
  tagText: { color: '#F5961D', fontWeight: '600', fontSize: 13 },
  kingBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  kingLabel: {
    fontSize: 10, color: '#6B7280', letterSpacing: 2,
    marginBottom: 8, fontWeight: '700',
  },
  kingEmpty: { fontSize: 14, color: '#9CA3AF' },
  claimBtn: {
    backgroundColor: '#F5961D', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  claimBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
