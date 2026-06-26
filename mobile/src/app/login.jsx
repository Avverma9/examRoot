import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView,
  ScrollView, Platform, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestOTP, googleLoginApi } from '../services/authApi';
import { loginSuccess } from '../store/slices/authSlice';
import { fetchSubscriptions } from '../store/slices/paymentSlice';
import { useAuth } from '../context/AuthContext';

const TAB_EMAIL = 'email';
const TAB_PHONE = 'phone';

export default function LoginScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useAuth();

  const [activeTab,      setActiveTab]      = useState(TAB_EMAIL);
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [googleLoading,  setGoogleLoading]  = useState(false);
  const [error,          setError]          = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  // ── Auth Guard: redirect to tabs if already logged in ─────────────────────
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, router]);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Initialize Google Sign-In on component mount
    const initGoogleSignIn = async () => {
      try {
        const { configureGoogleSignIn } = await import('../utils/googleSignIn');
        // TODO: Add your Google Client ID to .env
        const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
        if (googleClientId) {
          await configureGoogleSignIn(googleClientId);
        }
      } catch (err) {
        console.warn('Google Sign-In initialization failed:', err.message);
      }
    };
    initGoogleSignIn();
  }, []);

  const handleGooglePress = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { signInWithGoogle } = await import('../utils/googleSignIn');
      const { idToken } = await signInWithGoogle();

      // Send ID token to backend — gets back { token, user } with profileImage
      const res = await googleLoginApi(idToken);

      // Persist token + full user object (including profileImage) to AsyncStorage
      await AsyncStorage.setItem('authToken', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));

      // Update Redux state
      dispatch(loginSuccess({ user: res.user, token: res.token }));
      dispatch(fetchSubscriptions(res.token));

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err) {
      const cancelled = err.code === 'SIGN_IN_CANCELLED' || err.message?.includes('cancelled');
      if (!cancelled) {
        setError(err.message || 'Google sign-in failed');
      }
      console.error('Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── OTP flow ───────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError('');
    if (activeTab === TAB_EMAIL) {
      if (!email.trim()) return setError('Please enter your email address');
      if (!emailRegex.test(email.trim())) return setError('Please enter a valid email address');
    } else {
      const cleaned = phone.replace(/\D/g, '');
      if (!cleaned) return setError('Please enter your mobile number');
      if (!phoneRegex.test(cleaned)) return setError('Enter a valid 10-digit Indian mobile number');
    }
    try {
      setLoading(true);
      const payload = activeTab === TAB_EMAIL
        ? { email: email.trim().toLowerCase() }
        : { phone: phone.replace(/\D/g, '').slice(-10) };
      const res = await requestOTP(payload);
      router.push({
        pathname: '/otp-verify',
        params: {
          channel:      res.channel,
          identifier:   res.email || res.phone,
          requiresName: String(!!res.requiresName),
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // While auth is being checked or user is already logged in, show loader
  if (!isInitialized || isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Feather name="book-open" size={40} color="#D97706" />
          </View>
          <Text style={styles.appName}>ExamRoot</Text>
          <Text style={styles.tagline}>Your Path to Success</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>Sign in to continue your preparation</Text>

          {/* Google button */}
          <TouchableOpacity
            onPress={handleGooglePress}
            disabled={googleLoading}
            activeOpacity={0.85}
            style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with OTP</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            {[TAB_EMAIL, TAB_PHONE].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setError(''); }}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Feather
                  name={tab === TAB_EMAIL ? 'mail' : 'smartphone'}
                  size={14}
                  color={activeTab === tab ? '#D97706' : '#94A3B8'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === TAB_EMAIL ? 'Email OTP' : 'Mobile OTP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          {activeTab === TAB_EMAIL ? (
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Feather name="mail" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputRow}>
                <Text style={styles.countryCode}>🇮🇳 +91</Text>
                <View style={styles.inputDivider} />
                <TextInput
                  style={[styles.input, { letterSpacing: 1 }]}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 7 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Send OTP button */}
          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.otpBtn, loading && styles.otpBtnDisabled]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.otpBtnText}>Sending OTP…</Text>
              </>
            ) : (
              <>
                <Text style={styles.otpBtnText}>Send OTP</Text>
                <Feather name="arrow-right" size={17} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  logoWrap:   { alignItems: 'center', paddingTop: 72, paddingBottom: 20 },
  logoCircle: { backgroundColor: '#FFF7ED', padding: 18, borderRadius: 999, borderWidth: 1.5, borderColor: '#FDE68A', marginBottom: 14, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  appName:    { fontSize: 30, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  tagline:    { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 4 },

  card:       { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4 },
  heading:    { fontSize: 21, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  subheading: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 22 },

  googleBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 10 },
  googleBtnDisabled: { opacity: 0.6 },
  googleIcon:        { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleIconText:    { color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 22 },
  googleBtnText:     { fontSize: 15, fontWeight: '700', color: '#374151' },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  tabRow:        { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 3, marginBottom: 18 },
  tab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10 },
  tabActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2 },
  tabText:       { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#D97706', fontWeight: '700' },

  label:        { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap:    { marginBottom: 14 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#F9FAFB' },
  inputIcon:    { marginRight: 10 },
  countryCode:  { fontSize: 13, fontWeight: '700', color: '#374151', marginRight: 8 },
  inputDivider: { width: 1, height: 16, backgroundColor: '#E2E8F0', marginRight: 10 },
  input:        { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 11, marginBottom: 14 },
  errorText: { flex: 1, color: '#DC2626', fontSize: 12, fontWeight: '500' },

  otpBtn:         { backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#D97706', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 4 },
  otpBtnDisabled: { backgroundColor: '#FCD34D', shadowOpacity: 0 },
  otpBtnText:     { color: '#fff', fontWeight: '800', fontSize: 15 },

  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 20, paddingHorizontal: 32 },
});
