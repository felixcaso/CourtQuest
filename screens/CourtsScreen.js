import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Modal, Image,
  TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const COURTS = [
  { id: '1', name: 'Central Park Pickleball', address: 'Central Park, NY 10024', courts: 4, lat: 40.7812, lng: -73.9665 },
  { id: '2', name: 'Queensbridge Park', address: '40-20 21st St, Long Island City, NY 11101', courts: 6, lat: 40.7549, lng: -73.9458 },
  { id: '3', name: 'East River Park', address: 'FDR Dr & Delancey St, NY 10002', courts: 4, lat: 40.7133, lng: -73.9731 },
  { id: '4', name: 'Flushing Meadows Corona Park', address: 'Flushing Meadows, Queens, NY 11368', courts: 8, lat: 40.7282, lng: -73.8418 },
  { id: '5', name: 'Prospect Park Pickleball', address: 'Prospect Park, Brooklyn, NY 11215', courts: 4, lat: 40.6602, lng: -73.9690 },
  { id: '6', name: 'McCarren Park', address: 'Driggs Ave & N 12th St, Brooklyn, NY 11222', courts: 3, lat: 40.7208, lng: -73.9516 },
  { id: '7', name: 'Inwood Hill Park', address: 'Inwood Hill Park, NY 10034', courts: 2, lat: 40.8681, lng: -73.9244 },
  { id: '8', name: 'Riverside Park (96th St)', address: 'Riverside Park, NY 10025', courts: 2, lat: 40.7938, lng: -73.9732 },
  { id: '9', name: 'Alley Pond Park', address: 'Alley Pond Park, Queens, NY 11364', courts: 3, lat: 40.7380, lng: -73.7529 },
  { id: '10', name: 'Silver Lake Park', address: 'Silver Lake Park, Staten Island, NY 10301', courts: 2, lat: 40.6282, lng: -74.0901 },
  { id: '11', name: 'Randalls Island', address: 'Randalls Island Park, NY 10035', courts: 6, lat: 40.7916, lng: -73.9271 },
  { id: '12', name: 'Astoria Park', address: 'Astoria Park, Queens, NY 11102', courts: 3, lat: 40.7794, lng: -73.9317 },
  { id: '13', name: 'Fort Greene Park', address: 'Fort Greene Park, Brooklyn, NY 11205', courts: 2, lat: 40.6900, lng: -73.9745 },
  { id: '14', name: 'Clove Lakes Park', address: 'Clove Lakes Park, Staten Island, NY 10310', courts: 3, lat: 40.6282, lng: -74.1154 },
  { id: '15', name: 'Highbridge Park', address: 'Highbridge Park, NY 10033', courts: 2, lat: 40.8451, lng: -73.9289 },
  { id: '16', name: 'Van Cortlandt Park', address: 'Van Cortlandt Park, Bronx, NY 10471', courts: 4, lat: 40.8986, lng: -73.8958 },
  { id: '17', name: 'Pelham Bay Park', address: 'Pelham Bay Park, Bronx, NY 10464', courts: 3, lat: 40.8679, lng: -73.8097 },
  { id: '18', name: 'Sunset Park', address: 'Sunset Park, Brooklyn, NY 11220', courts: 2, lat: 40.6469, lng: -74.0042 },
  { id: '19', name: 'Cunningham Park', address: 'Cunningham Park, Queens, NY 11427', courts: 4, lat: 40.7248, lng: -73.7666 },
  { id: '20', name: 'Crotona Park', address: 'Crotona Park, Bronx, NY 10457', courts: 2, lat: 40.8353, lng: -73.9004 },
  { id: '21', name: 'St. James Park', address: 'St. James Park, Bronx, NY 10457', courts: 3, lat: 40.8420, lng: -73.9108 },
  { id: '22', name: 'Haffen Park', address: 'Haffen Park, Bronx, NY 10469', courts: 4, lat: 40.8698, lng: -73.8654 },
  { id: '23', name: 'Shoelace Park', address: 'Shoelace Park, Bronx, NY 10462', courts: 2, lat: 40.8441, lng: -73.8721 },
  { id: '24', name: 'Mullaly Park', address: 'Mullaly Park, Bronx, NY 10452', courts: 3, lat: 40.8280, lng: -73.9261 },
  { id: '25', name: 'Concrete Plant Park', address: 'Concrete Plant Park, Bronx, NY 10472', courts: 2, lat: 40.8189, lng: -73.8795 },
];

// King of the Court data
const KINGS = {
  '1':  { name: 'Jonathan Martin', initials: 'JM', wins: 18, since: 'Jan 2026' },
  '3':  { name: 'Jonathan Martin', initials: 'JM', wins: 15, since: 'Feb 2026' },
  '7':  { name: 'Jonathan Martin', initials: 'JM', wins: 12, since: 'Mar 2026' },
  '8':  { name: 'Jonathan Martin', initials: 'JM', wins: 9,  since: 'Mar 2026' },
  '15': { name: 'Jonathan Martin', initials: 'JM', wins: 7,  since: 'Mar 2026' },
  '21': { name: 'Felix Caso', initials: 'FC', wins: 10, since: 'Apr 2026' },
  '22': { name: 'Felix Caso', initials: 'FC', wins: 8,  since: 'Apr 2026' },
  '23': { name: 'Felix Caso', initials: 'FC', wins: 9,  since: 'Apr 2026' },
  '24': { name: 'Felix Caso', initials: 'FC', wins: 7,  since: 'Apr 2026' },
  '25': { name: 'Felix Caso', initials: 'FC', wins: 6,  since: 'Apr 2026' },
};

// Avatar color array (same as ProfileScreen)
const AVATAR_COLORS = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];

function getAvatarColor(name) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// Haversine formula — returns distance in metres
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Leaderboard mock data per court
function getLeaderboard(courtId) {
  const king = KINGS[courtId];

  if (courtId === '7') {
    return [
      { rank: 1, name: 'Jonathan Martin', initials: 'JM', wins: 12 },
      { rank: 2, name: 'Marcus Lee',      initials: 'ML', wins: 8 },
      { rank: 3, name: 'Priya Sharma',    initials: 'PS', wins: 5 },
    ];
  }

  if (['21', '22', '23', '24', '25'].includes(courtId)) {
    return [
      { rank: 1, name: 'Felix Caso',   initials: 'FC', wins: king.wins },
      { rank: 2, name: 'Player Two',   initials: 'P2', wins: 4 },
      { rank: 3, name: 'Player Three', initials: 'P3', wins: 2 },
    ];
  }

  if (king) {
    return [
      { rank: 1, name: 'Jonathan Martin', initials: 'JM', wins: king.wins },
      { rank: 2, name: 'Player Two',      initials: 'P2', wins: 4 },
      { rank: 3, name: 'Player Three',    initials: 'P3', wins: 2 },
    ];
  }
  return [
    { rank: 1, name: 'Player One',   initials: 'P1', wins: 7 },
    { rank: 2, name: 'Player Two',   initials: 'P2', wins: 4 },
    { rank: 3, name: 'Player Three', initials: 'P3', wins: 2 },
  ];
}

const RANK_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #080F1E; }
    .leaflet-tile-pane { filter: brightness(0.85) saturate(0.9); }
    .leaflet-control-zoom { border: none !important; }
    .leaflet-control-zoom a { background: #0C1A36 !important; color: #F5961D !important; border: 1px solid rgba(245,150,29,0.3) !important; font-weight: 800 !important; }
    .leaflet-control-zoom a:hover { background: rgba(245,150,29,0.15) !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([40.7282, -73.9442], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const orangeIcon = L.divIcon({
      html: '<div style="background:#F5961D;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(245,150,29,0.6);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: ''
    });

    const redIcon = L.divIcon({
      html: '<div style="background:#EF4444;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.6);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: ''
    });

    const courts = ${JSON.stringify(COURTS)};
    const claimedIds = ${JSON.stringify(Object.keys(KINGS))};
    courts.forEach(c => {
      const icon = claimedIds.includes(c.id) ? redIcon : orangeIcon;
      L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .on('click', () => {
          map.flyTo([c.lat, c.lng], 15, { duration: 0.8 });
          window.ReactNativeWebView.postMessage(JSON.stringify(c));
        });
    });
  </script>
</body>
</html>
`;

// Format ms remaining as HH:MM:SS
function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function CourtsScreen({ user }) {
  const [selected, setSelected] = useState(null);
  const [pendingClaims, setPendingClaims] = useState({});
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  // Stats panel
  const [statsVisible, setStatsVisible] = useState(false);

  // Courts Visited — Set stored as plain object (id -> true) for state
  const [visitedCourts, setVisitedCourts] = useState([]);
  const locationSubRef = useRef(null);

  const king = selected ? KINGS[selected.id] : null;
  const leaderboard = selected ? getLeaderboard(selected.id) : [];
  const isPending = selected ? !!pendingClaims[selected.id] : false;
  const pendingTimestamp = selected ? pendingClaims[selected.id] : null;
  const msRemaining = pendingTimestamp
    ? Math.max(0, pendingTimestamp + 24 * 60 * 60 * 1000 - Date.now())
    : 0;

  // --- Location: request permission + watch position ---
  useEffect(() => {
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !active) return;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          setVisitedCourts(prev => {
            const prevSet = new Set(prev);
            let changed = false;
            COURTS.forEach(court => {
              if (!prevSet.has(court.id)) {
                const dist = getDistance(latitude, longitude, court.lat, court.lng);
                if (dist <= 200) {
                  prevSet.add(court.id);
                  changed = true;
                }
              }
            });
            return changed ? Array.from(prevSet) : prev;
          });
        }
      );
    })();

    return () => {
      active = false;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  // Start / stop the countdown interval when modal opens with a pending claim
  useEffect(() => {
    if (selected && isPending) {
      intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selected, isPending]);

  function handleClaim() {
    if (!selected) return;
    const courtId = selected.id;
    setPendingClaims(prev => ({ ...prev, [courtId]: Date.now() }));
    setClaimSuccess(courtId);
    setTimeout(() => {
      setClaimSuccess(null);
      setSelected(null);
    }, 3000);
  }

  function handleClose() {
    setClaimSuccess(null);
    setSelected(null);
  }

  // Derive stats for the panel
  const conqueredCourts = user
    ? Object.entries(KINGS).filter(([, k]) => k.name === user.name)
    : [];

  const userInitials = user
    ? user.initials || (user.name || '').slice(0, 2).toUpperCase()
    : '??';

  const userAvatarColor = user ? getAvatarColor(user.name) : '#F5961D';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CourtQuest</Text>
            <Text style={styles.headerSub}>{COURTS.length} courts near NYC</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBadge}
            onPress={() => setStatsVisible(true)}
            activeOpacity={0.75}
          >
            <Image
              source={require('../assets/CourtQuestIcon.png')}
              style={{ width: 32, height: 32, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <WebView
        style={styles.map}
        source={{ html: mapHTML }}
        onMessage={(e) => setSelected(JSON.parse(e.nativeEvent.data))}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* Court detail modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
        {selected && (
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.handle} />
              <Text style={styles.sheetName}>{selected.name}</Text>
              <Text style={styles.sheetAddr}>{selected.address}</Text>
              <View style={styles.tags}>
                <View style={styles.tag}><Text style={styles.tagText}>🏓 {selected.courts} Courts</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>☀️ Outdoor</Text></View>
              </View>

              {claimSuccess === selected.id ? (
                /* Claim success message */
                <View style={styles.claimSuccessBox}>
                  <Text style={styles.claimSuccessTitle}>👑 Claim Submitted!</Text>
                  <Text style={styles.claimSuccessMsg}>
                    Your claim is pending! If no one challenges you within 24 hours, you'll be crowned King of this Court 👑
                  </Text>
                  <Text style={styles.claimSuccessCountdown}>
                    {formatCountdown(pendingClaims[selected.id]
                      ? Math.max(0, pendingClaims[selected.id] + 24 * 60 * 60 * 1000 - Date.now())
                      : 0)} remaining
                  </Text>
                </View>
              ) : (
                <>
                  {/* King of the Court section */}
                  <View style={king ? styles.kingBoxFilled : styles.kingBox}>
                    <Text style={styles.kingLabel}>KING OF THE COURT</Text>
                    {king ? (
                      <View style={styles.kingCard}>
                        <View style={[styles.kingAvatar, { backgroundColor: getAvatarColor(king.name) }]}>
                          <Text style={styles.kingAvatarText}>{king.initials}</Text>
                        </View>
                        <View style={styles.kingInfo}>
                          <Text style={styles.kingName}>{king.name}</Text>
                          <Text style={styles.kingRoleLabel}>👑 King of the Court</Text>
                          <Text style={styles.kingStats}>{king.wins} Wins · Since {king.since}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.kingEmpty}>No one has claimed this court yet</Text>
                    )}
                  </View>

                  {/* Action button / pending claim state */}
                  {isPending ? (
                    <View style={styles.pendingBox}>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>⏳ Claim Pending</Text>
                      </View>
                      <Text style={[styles.countdownText, { fontVariant: ['tabular-nums'] }]}>
                        {formatCountdown(msRemaining)}
                      </Text>
                      <Text style={styles.pendingMsg}>
                        A claim is pending. Challenge before time runs out!
                      </Text>
                      <TouchableOpacity style={styles.challengeBtn} onPress={() => setSelected(null)}>
                        <Text style={styles.challengeBtnText}>⚔️  Challenge Claim</Text>
                      </TouchableOpacity>
                    </View>
                  ) : king ? (
                    <TouchableOpacity style={styles.challengeBtn} onPress={() => setSelected(null)}>
                      <Text style={styles.challengeBtnText}>⚔️  Challenge King</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.claimBtn} onPress={handleClaim}>
                      <Text style={styles.claimBtnText}>👑  Claim This Court</Text>
                    </TouchableOpacity>
                  )}

                  {/* Court Leaderboard section */}
                  <View style={styles.leaderboardSection}>
                    <Text style={styles.leaderboardTitle}>COURT LEADERBOARD</Text>
                    {leaderboard.map((player) => (
                      <View key={player.rank} style={styles.leaderboardRow}>
                        <Text style={[styles.leaderboardRank, { color: RANK_COLORS[player.rank] }]}>
                          #{player.rank}
                        </Text>
                        <View style={[styles.lbAvatar, { backgroundColor: getAvatarColor(player.name) }]}>
                          <Text style={styles.lbAvatarText}>{player.initials}</Text>
                        </View>
                        <Text style={styles.lbName}>{player.name}</Text>
                        <Text style={styles.lbWins}>{player.wins}W</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Player Stats Panel Modal */}
      <Modal visible={statsVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setStatsVisible(false)}
        />
        <View style={styles.statsSheet}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.handle} />

            {/* Header row */}
            <View style={styles.statsHeader}>
              <Text style={styles.statsHeaderTitle}>Your CourtQuest Stats</Text>
              <TouchableOpacity onPress={() => setStatsVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.statsCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Player avatar + info */}
            <View style={styles.statsPlayerRow}>
              {user && user.photoUri ? (
                <Image
                  source={{ uri: user.photoUri }}
                  style={styles.statsAvatarPhoto}
                />
              ) : (
                <View style={[styles.statsAvatar, { backgroundColor: userAvatarColor }]}>
                  <Text style={styles.statsAvatarText}>{userInitials}</Text>
                </View>
              )}
              <View style={styles.statsPlayerInfo}>
                <Text style={styles.statsPlayerName}>{user ? user.name : '—'}</Text>
                {user && user.email ? (
                  <Text style={styles.statsPlayerEmail}>{user.email}</Text>
                ) : null}
              </View>
            </View>

            {/* 2x2 stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>#—</Text>
                <Text style={styles.statCardLabel}>Global Rank</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{conqueredCourts.length}</Text>
                <Text style={styles.statCardLabel}>Courts Conquered</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{visitedCourts.length}</Text>
                <Text style={styles.statCardLabel}>Courts Visited</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>0</Text>
                <Text style={styles.statCardLabel}>Challenges Won</Text>
              </View>
            </View>

            {/* Courts Conquered list */}
            {conqueredCourts.length > 0 && (
              <View style={styles.conqueredSection}>
                <Text style={styles.conqueredTitle}>COURTS CONQUERED</Text>
                {conqueredCourts.map(([courtId, kingData]) => {
                  const court = COURTS.find(c => c.id === courtId);
                  return (
                    <View key={courtId} style={styles.conqueredRow}>
                      <Text style={styles.conqueredCourtName}>
                        {court ? court.name : `Court ${courtId}`}
                      </Text>
                      <Text style={styles.conqueredWins}>{kingData.wins}W</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
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
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(245,150,29,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  map: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#0C1A36',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 48,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sheetAddr: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: 'rgba(245,150,29,0.12)', borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  tagText: { color: '#F5961D', fontWeight: '600', fontSize: 13 },

  // King box — empty state
  kingBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  // King box — filled state
  kingBoxFilled: {
    backgroundColor: 'rgba(245,150,29,0.08)',
    borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(245,150,29,0.2)',
  },
  kingLabel: { fontSize: 10, color: '#6B7280', letterSpacing: 2, marginBottom: 12, fontWeight: '700' },
  kingEmpty: { fontSize: 14, color: '#9CA3AF' },

  // King card (filled)
  kingCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kingAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  kingAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  kingInfo: { flex: 1 },
  kingName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  kingRoleLabel: { fontSize: 13, color: '#F5961D', fontWeight: '600', marginBottom: 2 },
  kingStats: { fontSize: 12, color: '#9CA3AF' },

  // Claim button
  claimBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 24,
  },
  claimBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Challenge button
  challengeBtn: {
    borderWidth: 1.5, borderColor: '#F5961D',
    backgroundColor: 'transparent', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 24,
  },
  challengeBtnText: { color: '#F5961D', fontWeight: '800', fontSize: 16 },

  // Claim success box
  claimSuccessBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 14, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
  },
  claimSuccessTitle: { fontSize: 20, fontWeight: '800', color: '#F59E0B', marginBottom: 10 },
  claimSuccessMsg: {
    fontSize: 14, color: '#E5E7EB', textAlign: 'center', lineHeight: 20, marginBottom: 14,
  },
  claimSuccessCountdown: {
    fontSize: 24, fontWeight: '800', color: '#F59E0B',
    fontVariant: ['tabular-nums'],
  },

  // Pending claim state
  pendingBox: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    marginBottom: 12,
  },
  pendingBadgeText: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
  countdownText: { fontSize: 24, fontWeight: '800', color: '#F59E0B', marginBottom: 8 },
  pendingMsg: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },

  // Leaderboard
  leaderboardSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  leaderboardTitle: {
    fontSize: 10, color: '#6B7280', letterSpacing: 2,
    fontWeight: '700', marginBottom: 14,
  },
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  leaderboardRank: { fontSize: 14, fontWeight: '900', width: 28, textAlign: 'center' },
  lbAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  lbAvatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  lbName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E7EB' },
  lbWins: { fontSize: 13, fontWeight: '700', color: '#F5961D' },

  // ---- Stats Panel ----
  statsSheet: {
    backgroundColor: '#0C1A36',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 48,
    maxHeight: '90%',
  },
  statsHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  statsHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsCloseBtn: { fontSize: 18, color: '#9CA3AF', fontWeight: '700' },

  statsPlayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
  },
  statsAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  statsAvatarPhoto: {
    width: 60, height: 60, borderRadius: 30,
  },
  statsAvatarText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  statsPlayerInfo: { flex: 1 },
  statsPlayerName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statsPlayerEmail: { fontSize: 13, color: '#6B7280' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  statCardValue: { fontSize: 26, fontWeight: '900', color: '#F5961D', marginBottom: 4 },
  statCardLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textAlign: 'center' },

  conqueredSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  conqueredTitle: {
    fontSize: 10, color: '#6B7280', letterSpacing: 2,
    fontWeight: '700', marginBottom: 14,
  },
  conqueredRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  conqueredCourtName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E7EB' },
  conqueredWins: { fontSize: 13, fontWeight: '700', color: '#F5961D' },
});
