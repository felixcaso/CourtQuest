import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useCourtStore from '../../store/useCourtStore';
import useAuthStore from '../../store/useAuthStore';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/fonts';

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  });
  const [locationGranted, setLocationGranted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const courts = useCourtStore((s) => s.courts);
  const selectedCourt = useCourtStore((s) => s.selectedCourt);
  const selectCourt = useCourtStore((s) => s.selectCourt);
  const claimCourt = useCourtStore((s) => s.claimCourt);
  const kingClaims = useCourtStore((s) => s.kingClaims);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({});
        setRegion((r) => ({
          ...r,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
      }
    })();
  }, []);

  const handleMarkerPress = (court) => {
    selectCourt(court);
    setSheetVisible(true);
  };

  const handleClaim = () => {
    if (selectedCourt && user) {
      claimCourt(selectedCourt.id, user.id);
    }
  };

  const getKingName = (courtId) => {
    const kingId = kingClaims[courtId];
    if (!kingId) return 'No King yet';
    if (kingId === user?.id) return user?.name || 'You';
    return 'Another player';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={locationGranted}
        userInterfaceStyle="dark"
      >
        {courts.map((court) => (
          <Marker
            key={court.id}
            coordinate={{ latitude: court.latitude, longitude: court.longitude }}
            onPress={() => handleMarkerPress(court)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={28} color={COLORS.orange} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Courts</Text>
        <Text style={styles.headerSub}>{courts.length} courts found</Text>
      </View>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSheetVisible(false)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          {selectedCourt && (
            <>
              <Text style={styles.sheetTitle}>{selectedCourt.name}</Text>
              <Text style={styles.sheetAddress}>{selectedCourt.address}</Text>

              <View style={styles.sheetRow}>
                <Ionicons name="ribbon" size={18} color={COLORS.orange} />
                <Text style={styles.sheetKing}>
                  King: <Text style={styles.sheetKingName}>{getKingName(selectedCourt.id)}</Text>
                </Text>
              </View>

              <View style={styles.sheetRow}>
                <Ionicons
                  name={selectedCourt.indoor ? 'home' : 'sunny'}
                  size={16}
                  color={COLORS.grayLight}
                />
                <Text style={styles.sheetMeta}>
                  {selectedCourt.indoor ? 'Indoor' : 'Outdoor'}
                </Text>
              </View>

              <View style={styles.sheetButtons}>
                <TouchableOpacity
                  style={styles.claimBtn}
                  onPress={handleClaim}
                >
                  <Ionicons name="trophy" size={16} color={COLORS.dark} />
                  <Text style={styles.claimBtnText}>Claim Court</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.challengeBtn}>
                  <Ionicons name="flash" size={16} color={COLORS.orange} />
                  <Text style={styles.challengeBtnText}>Challenge</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  map: { flex: 1 },
  markerContainer: {
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(8,15,30,0.85)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerSub: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: COLORS.navy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    minHeight: 280,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 4,
  },
  sheetAddress: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
    marginBottom: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sheetKing: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.md,
  },
  sheetKingName: {
    color: COLORS.orange,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  sheetMeta: {
    color: COLORS.grayLight,
    fontSize: FONT_SIZES.sm,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  claimBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    paddingVertical: 13,
    gap: 6,
  },
  claimBtnText: {
    color: COLORS.dark,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
  challengeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    paddingVertical: 13,
    gap: 6,
  },
  challengeBtnText: {
    color: COLORS.orange,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
});
