import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Image,
} from 'react-native';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const getInitials = (fullName, emailAddr) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (emailAddr) return emailAddr.slice(0, 2).toUpperCase();
    return 'ME';
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !name.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;
        const displayName = firebaseUser.displayName || email.split('@')[0];
        onLogin({
          name: displayName,
          email: firebaseUser.email,
          initials: getInitials(displayName, firebaseUser.email),
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;
        await updateProfile(firebaseUser, { displayName: name.trim() });
        onLogin({
          name: name.trim(),
          email: firebaseUser.email,
          initials: getInitials(name.trim(), firebaseUser.email),
        });
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    onLogin({
      name: 'Guest',
      email: '',
      initials: 'G',
    });
  };

  const canSubmit = email.trim() && password.trim() && (mode === 'login' || name.trim());

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoArea}>
              <Image
                source={require('../assets/VersaProLogo.webp')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoTagline}>Find your court. Claim your throne.</Text>
            </View>

            {/* Toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
                onPress={() => { setMode('login'); setError(''); }}
              >
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
                onPress={() => { setMode('signup'); setError(''); }}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={[styles.input, nameFocused && styles.inputFocused]}
                    placeholder="Your name"
                    placeholderTextColor="#4B5563"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  placeholder="you@example.com"
                  placeholderTextColor="#4B5563"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={[styles.input, passwordFocused && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#4B5563"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={canSubmit ? handleSubmit : undefined}
                />
              </View>

              {!!error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, (!canSubmit || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {loading
                    ? (mode === 'login' ? 'Logging in...' : 'Creating account...')
                    : (mode === 'login' ? 'Log In' : 'Create Account')
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.7}>
                <Text style={styles.guestBtnText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080F1E' },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 48,
  },

  logoArea: { alignItems: 'center', marginBottom: 44 },
  logoImage: { width: 288, height: 96, marginBottom: 16 },
  logoTagline: { fontSize: 15, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 22 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#0C1A36',
    borderRadius: 14, padding: 4,
    marginBottom: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#F5961D' },
  toggleText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  toggleTextActive: { color: '#fff' },

  form: { gap: 0 },
  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    letterSpacing: 1, marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0C1A36',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#fff',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  inputFocused: {
    borderColor: '#F5961D',
    backgroundColor: 'rgba(245,150,29,0.05)',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  submitBtn: {
    backgroundColor: '#F5961D', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  guestBtn: { alignItems: 'center', paddingVertical: 8 },
  guestBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});
