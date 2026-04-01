import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, SafeAreaView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CourtsScreen from './screens/CourtsScreen';
import ControlScreen from './screens/ControlScreen';
import CommunityScreen from './screens/CommunityScreen';
import AuthScreen from './screens/AuthScreen';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const TABS = [
  { id: 'courts',    label: 'CourtQuest', icon: '🏓' },
  { id: 'control',   label: 'Control',    icon: '🎮' },
  { id: 'community', label: 'Community',  icon: '💬' },
  { id: 'profile',   label: 'Profile',    icon: '👤' },
];

function ProfileScreen({ user, onSignOut, onPhotoChange }) {
  const colors = ['#F5961D', '#4ADE80', '#818CF8', '#F472B6', '#38BDF8'];
  const avatarColor = colors[(user.name.charCodeAt(0) || 0) % colors.length];

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onPhotoChange(result.assets[0].uri);
    }
  };

  return (
    <View style={profileStyles.container}>
      <SafeAreaView style={profileStyles.safe}>
        <View style={profileStyles.header}>
          <Text style={profileStyles.headerTitle}>Profile</Text>
        </View>
      </SafeAreaView>

      <View style={profileStyles.body}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={profileStyles.avatarWrapper}>
          {user.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={profileStyles.avatarPhoto} />
          ) : (
            <View style={[profileStyles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={profileStyles.avatarText}>{user.initials}</Text>
            </View>
          )}
          <View style={profileStyles.cameraBadge}>
            <Text style={profileStyles.cameraBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={profileStyles.name}>{user.name}</Text>
        {!!user.email && <Text style={profileStyles.email}>{user.email}</Text>}

        <View style={profileStyles.statsRow}>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>0</Text>
            <Text style={profileStyles.statLabel}>Courts Claimed</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>0</Text>
            <Text style={profileStyles.statLabel}>Posts</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Text style={profileStyles.statNum}>0</Text>
            <Text style={profileStyles.statLabel}>Games Played</Text>
          </View>
        </View>

        <TouchableOpacity style={profileStyles.signOutBtn} onPress={onSignOut} activeOpacity={0.85}>
          <Text style={profileStyles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080F1E' },
  safe: { backgroundColor: '#080F1E' },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,150,29,0.15)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  body: { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 28 },
  avatarWrapper: {
    width: 88, height: 88, marginBottom: 16,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: {
    width: 88, height: 88, borderRadius: 44,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 30 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#0C1A36',
    borderWidth: 2, borderColor: '#080F1E',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadgeText: { fontSize: 11, lineHeight: 13 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 36 },
  statsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 48, width: '100%',
  },
  statCard: {
    flex: 1, backgroundColor: '#0C1A36', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statNum: { fontSize: 22, fontWeight: '900', color: '#F5961D', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  signOutBtn: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  signOutBtnText: { color: '#9CA3AF', fontWeight: '700', fontSize: 16 },
});

const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'ME';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('courts');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        setUser({
          name: displayName,
          email: firebaseUser.email,
          initials: getInitials(displayName, firebaseUser.email),
        });
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) {
    // Still checking persisted auth state — render nothing (or a splash)
    return <View style={styles.root} />;
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <AuthScreen onLogin={(u) => setUser(u)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Screens */}
      <View style={styles.screen}>
        {activeTab === 'courts'    && <CourtsScreen user={user} />}
        {activeTab === 'control'   && <ControlScreen />}
        {activeTab === 'community' && <CommunityScreen user={user} />}
        {activeTab === 'profile'   && (
          <ProfileScreen
            user={user}
            onSignOut={async () => {
              await signOut(auth);
              setUser(null);
              setActiveTab('courts');
            }}
            onPhotoChange={(uri) => setUser(prev => ({ ...prev, photoUri: uri }))}
          />
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                {tab.id === 'courts' ? (
                  <Image source={require('./assets/CourtQuestIcon.png')} style={{width:26,height:26,resizeMode:'contain'}} />
                ) : tab.id === 'control' ? (
                  <Image source={require('./assets/VersaProLogo.webp')} style={{width:28,height:28,resizeMode:'contain'}} />
                ) : tab.id === 'profile' ? (() => {
                  const colors = ['#F5961D','#4ADE80','#818CF8','#F472B6','#38BDF8'];
                  const avatarColor = colors[(user.name.charCodeAt(0)||0) % colors.length];
                  return user.photoUri ? (
                    <Image source={{uri: user.photoUri}} style={{width:28,height:28,borderRadius:14,resizeMode:'cover',borderWidth:active?2:0,borderColor:'#F5961D'}} />
                  ) : (
                    <View style={{width:28,height:28,borderRadius:14,backgroundColor:avatarColor,alignItems:'center',justifyContent:'center',borderWidth:active?2:0,borderColor:'#F5961D'}}>
                      <Text style={{color:'#fff',fontWeight:'800',fontSize:11}}>{user.initials}</Text>
                    </View>
                  );
                })() : (
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                )}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080F1E' },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0C1A36',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,150,29,0.15)',
    paddingBottom: 28,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 4,
  },
  tabIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(245,150,29,0.15)',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: {
    fontSize: 10, fontWeight: '600', color: '#6B7280',
  },
  tabLabelActive: {
    color: '#F5961D',
  },
});
