import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Modal, Image,
  TouchableOpacity, ScrollView,
  Linking, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { db } from '../firebase';
import {
  doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc,
  collection, serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { awardXP } from '../services/xpService';
import { sendChallenge } from '../services/challengeService';

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

// KINGS is now loaded from Firestore in real-time (see component state)

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

// Leaderboard — shows king at top if present
function getLeaderboard(courtId, kings) {
  const king = kings[courtId];
  if (king) {
    return [
      { rank: 1, name: king.name, initials: king.initials, wins: king.wins || 1 },
      { rank: 2, name: 'Player Two',   initials: 'P2', wins: 0 },
      { rank: 3, name: 'Player Three', initials: 'P3', wins: 0 },
    ];
  }
  return [
    { rank: 1, name: 'Player One',   initials: 'P1', wins: 0 },
    { rank: 2, name: 'Player Two',   initials: 'P2', wins: 0 },
    { rank: 3, name: 'Player Three', initials: 'P3', wins: 0 },
  ];
}

const RANK_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function buildMapHTML(kings, userCrewId) {
  // Build marker data: for each court, determine color based on claim status
  // unclaimed = orange, claimed by user's crew = green, claimed by rival = red
  const markerData = COURTS.map(c => {
    const king = kings[c.id];
    let color = '#F5961D'; // unclaimed = orange
    let crewLabel = '';
    if (king) {
      if (userCrewId && king.crewId === userCrewId) {
        color = '#4ADE80'; // user's crew = green
      } else {
        color = '#EF4444'; // rival = red
      }
      crewLabel = king.crewName || '';
    }
    return { ...c, color, crewLabel, claimed: !!king };
  });

  return `
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
    .crew-label { font-size: 9px; font-weight: 800; color: #fff; text-align: center; white-space: nowrap; text-shadow: 0 1px 3px rgba(0,0,0,0.8); margin-top: 1px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([40.7282, -73.9442], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap'
    }).addTo(map);

    const markers = ${JSON.stringify(markerData)};
    markers.forEach(c => {
      const labelHtml = c.crewLabel ? '<div class="crew-label">' + c.crewLabel + '</div>' : '';
      const icon = L.divIcon({
        html: '<div style="display:flex;flex-direction:column;align-items:center;">' +
              '<div style="background:' + c.color + ';width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px ' + c.color + '88;"></div>' +
              labelHtml + '</div>',
        iconSize: [50, 30],
        iconAnchor: [25, 9],
        className: ''
      });

      L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .on('click', () => {
          map.flyTo([c.lat, c.lng], 15, { duration: 0.8 });
          window.ReactNativeWebView.postMessage(JSON.stringify({id:c.id,name:c.name,address:c.address,courts:c.courts,lat:c.lat,lng:c.lng}));
        });
    });
  </script>
</body>
</html>
`;
}

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
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengeSent, setChallengeSent] = useState(null); // courtId

  // Courts Visited — Set stored as plain object (id -> true) for state
  const [visitedCourts, setVisitedCourts] = useState([]);
  const locationSubRef = useRef(null);

  // Favorite courts
  const [favoriteCourts, setFavoriteCourts] = useState([]);

  // User's crew info (for map coloring and claim recording)
  const [userCrewId, setUserCrewId] = useState(null);
  const [userCrewName, setUserCrewName] = useState(null);
  const [challengeWins, setChallengeWins] = useState(0);

  // Kings from Firestore — { courtId: { uid, name, initials, wins, since, claimedAt, pendingUntil } }
  const [kings, setKings] = useState({});

  // Subscribe to all court docs for real-time king data
  useEffect(() => {
    const unsubs = COURTS.map(court => {
      const courtDocRef = doc(db, 'courts', court.id);
      return onSnapshot(courtDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setKings(prev => ({ ...prev, [court.id]: data }));
          // Check pending claims — if pendingUntil has passed, finalize the king
          if (data.pendingUntil && data.pendingUntil.toDate && data.pendingUntil.toDate() <= new Date() && !data.confirmed) {
            // Finalize: mark as confirmed king
            updateDoc(courtDocRef, { confirmed: true }).catch(() => {});
          }
        } else {
          setKings(prev => {
            const next = { ...prev };
            delete next[court.id];
            return next;
          });
        }
      }, () => {});
    });
    return () => unsubs.forEach(u => u());
  }, []);

  // Load favorites and crew info from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.favoriteCourts) setFavoriteCourts(data.favoriteCourts);
        if (data.crewId) setUserCrewId(data.crewId);
        if (data.crewName) setUserCrewName(data.crewName);
        if (data.challengeWins) setChallengeWins(data.challengeWins);
      }
    }).catch(() => {});
  }, [user?.uid]);

  const king = selected ? kings[selected.id] : null;
  const leaderboard = selected ? getLeaderboard(selected.id, kings) : [];
  const isPending = selected && king && king.pendingUntil && !king.confirmed;
  const pendingTimestamp = isPending && king.pendingUntil?.toDate ? king.pendingUntil.toDate().getTime() : null;
  const msRemaining = pendingTimestamp
    ? Math.max(0, pendingTimestamp - Date.now())
    : 0;

  // --- Load visitedCourts from Firestore on mount ---
  useEffect(() => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((snap) => {
      if (snap.exists() && snap.data().visitedCourts) {
        setVisitedCourts(snap.data().visitedCourts);
      }
    }).catch(() => {});
  }, [user?.uid]);

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
                  // Persist to Firestore
                  if (user?.uid) {
                    updateDoc(doc(db, 'users', user.uid), {
                      visitedCourts: arrayUnion(court.id),
                    }).catch(() => {});
                    awardXP(user.uid, 10, 'visit_court').catch(() => {});
                  }
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
  }, [user?.uid]);

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

  async function handleClaim() {
    if (!selected || !user?.uid) return;
    const courtId = selected.id;
    const courtDocRef = doc(db, 'courts', courtId);
    const pendingUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const initials = user.initials || user.name.slice(0, 2).toUpperCase();
    try {
      const claimData = {
        currentKing: { uid: user.uid, name: user.name, initials },
        claimedAt: serverTimestamp(),
        pendingUntil,
        confirmed: false,
        wins: 1,
        name: user.name,
        initials,
      };
      // Record crew info if user is in a crew
      if (userCrewId) {
        claimData.crewId = userCrewId;
        claimData.crewName = userCrewName || '';
      }
      await setDoc(courtDocRef, claimData);
      // Increment courtsClaimed on user doc
      await updateDoc(doc(db, 'users', user.uid), {
        courtsClaimed: increment(1),
      }).catch(() => {});
      // Update crew's courtsControlled count
      if (userCrewId) {
        updateDoc(doc(db, 'crews', userCrewId), {
          courtsControlled: increment(1),
        }).catch(() => {});
      }
      await awardXP(user.uid, 50, 'claim_court').catch(() => {});
      setClaimSuccess(courtId);
      setTimeout(() => {
        setClaimSuccess(null);
        setSelected(null);
      }, 3000);
    } catch (err) {
      console.error('Claim error:', err);
    }
  }

  function handleClose() {
    setClaimSuccess(null);
    setChallengeSent(null);
    setSelected(null);
  }

  async function handleChallengeKing() {
    if (!selected || !user?.uid || !king) return;
    const kingUid = king.currentKing?.uid;
    const kingName = king.currentKing?.name || king.name;
    if (!kingUid || kingUid === user.uid) return;
    setChallengeSending(true);
    try {
      await sendChallenge(user.uid, user.name, kingUid, kingName, selected.id, selected.name);
      setChallengeSent(selected.id);
      setTimeout(() => setChallengeSent(null), 3000);
    } catch (e) {
      console.warn('Challenge error:', e);
    } finally {
      setChallengeSending(false);
    }
  }

  // Derive stats for the panel
  const conqueredCourts = user
    ? Object.entries(kings).filter(([, k]) => k.currentKing?.uid === user.uid || k.name === user.name)
    : [];

  const userInitials = user
    ? user.initials || (user.name || '').slice(0, 2).toUpperCase()
    : '??';

  const userAvatarColor = user ? getAvatarColor(user.name) : '#F5961D';

  return (
    <View style={styles.container}>
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

      <WebView
        style={styles.map}
        source={{ html: buildMapHTML(kings, userCrewId) }}
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
                {king && king.crewName ? (
                  <View style={[styles.tag, { backgroundColor: 'rgba(129,140,248,0.12)' }]}>
                    <Text style={[styles.tagText, { color: '#818CF8' }]}>⚔️ {king.crewName}</Text>
                  </View>
                ) : null}
              </View>

              {/* Court photos placeholder */}
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>📸</Text>
                <Text style={styles.photoPlaceholderText}>Court photos coming soon</Text>
              </View>

              {/* Directions + Favorite row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => {
                    const url = Platform.OS === 'ios'
                      ? `http://maps.apple.com/?daddr=${selected.lat},${selected.lng}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.directionsBtnText}>🧭  Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.favBtn, favoriteCourts.includes(selected.id) && styles.favBtnActive]}
                  onPress={() => {
                    if (!user?.uid) return;
                    const isFav = favoriteCourts.includes(selected.id);
                    const userRef = doc(db, 'users', user.uid);
                    if (isFav) {
                      setFavoriteCourts(prev => prev.filter(id => id !== selected.id));
                      updateDoc(userRef, { favoriteCourts: arrayRemove(selected.id) }).catch(() => {});
                    } else {
                      setFavoriteCourts(prev => [...prev, selected.id]);
                      updateDoc(userRef, { favoriteCourts: arrayUnion(selected.id) }).catch(() => {});
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.favBtnText}>{favoriteCourts.includes(selected.id) ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>

              {claimSuccess === selected.id ? (
                /* Claim success message */
                <View style={styles.claimSuccessBox}>
                  <Text style={styles.claimSuccessTitle}>👑 Claim Submitted!</Text>
                  <Text style={styles.claimSuccessMsg}>
                    Your claim is pending! If no one challenges you within 24 hours, you'll be crowned King of this Court 👑
                  </Text>
                  <Text style={styles.claimSuccessCountdown}>
                    {formatCountdown(msRemaining)} remaining
                  </Text>
                </View>
              ) : (
                <>
                  {/* King of the Court section */}
                  <View style={king ? styles.kingBoxFilled : styles.kingBox}>
                    <Text style={styles.kingLabel}>KING OF THE COURT</Text>
                    {king ? (
                      <View style={styles.kingCard}>
                        <View style={[styles.kingAvatar, { backgroundColor: getAvatarColor(king.currentKing?.name || king.name || '') }]}>
                          <Text style={styles.kingAvatarText}>{king.currentKing?.initials || king.initials || '??'}</Text>
                        </View>
                        <View style={styles.kingInfo}>
                          <Text style={styles.kingName}>{king.currentKing?.name || king.name}</Text>
                          <Text style={styles.kingRoleLabel}>{isPending ? '⏳ Claim Pending' : '👑 King of the Court'}</Text>
                          <Text style={styles.kingStats}>{king.wins || 1} Wins</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.kingEmpty}>No one has claimed this court yet</Text>
                    )}
                  </View>

                  {/* Action button / pending claim state */}
                  {challengeSent === selected.id ? (
                    <View style={styles.claimSuccessBox}>
                      <Text style={styles.claimSuccessTitle}>⚔️ Challenge Sent!</Text>
                      <Text style={styles.claimSuccessMsg}>
                        Your challenge has been sent to {king?.currentKing?.name || king?.name || 'the King'}. You'll be notified when they respond.
                      </Text>
                    </View>
                  ) : isPending ? (
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
                      {king?.currentKing?.uid !== user?.uid && (
                        <TouchableOpacity style={styles.challengeBtn} onPress={handleChallengeKing} disabled={challengeSending}>
                          <Text style={styles.challengeBtnText}>{challengeSending ? '...' : '⚔️  Challenge Claim'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : king ? (
                    king.currentKing?.uid !== user?.uid ? (
                      <TouchableOpacity style={styles.challengeBtn} onPress={handleChallengeKing} disabled={challengeSending}>
                        <Text style={styles.challengeBtnText}>{challengeSending ? '...' : '⚔️  Challenge the King'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.pendingBox, { borderColor: 'rgba(74,222,128,0.3)' }]}>
                        <Text style={[styles.pendingBadgeText, { color: '#4ADE80' }]}>You are the King!</Text>
                      </View>
                    )
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
                <Text style={styles.statCardValue}>{challengeWins}</Text>
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
                      <Text style={styles.conqueredWins}>{kingData.wins || 1}W</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingTop: Constants.statusBarHeight + 10,
    backgroundColor: '#080F1E',
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

  // Photo placeholder
  photoPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 20, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: { fontSize: 20, marginBottom: 4 },
  photoPlaceholderText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },

  // Directions + Favorite row
  actionRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  directionsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,150,29,0.12)', borderRadius: 12,
    paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(245,150,29,0.25)',
  },
  directionsBtnText: { color: '#F5961D', fontWeight: '700', fontSize: 14 },
  favBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  favBtnText: { fontSize: 22 },

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
