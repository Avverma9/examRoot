import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView,
  ScrollView, Platform, StyleSheet, Dimensions,
  LayoutAnimation, UIManager
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requestOTP, googleLoginApi, passwordLogin } from '../services/authApi';
import { loginSuccess } from '../store/slices/authSlice';
import { fetchSubscriptions } from '../store/slices/paymentSlice';
import { useAuth } from '../context/AuthContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useAuth();

  // State Management
  const [loginMode, setLoginMode] = useState('default'); // 'default' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    const initGoogleSignIn = async () => {
      try {
        const { configureGoogleSignIn } = await import('../utils/googleSignIn');
        const googleClientId = Constants.expoConfig?.extra?.publicConfig?.googleClientId;
        if (googleClientId) {
          await configureGoogleSignIn(googleClientId);
        }
      } catch (err) {
        console.warn('Google Sign-In initialization failed:', err.message);
      }
    };
    initGoogleSignIn();
  }, []);

  // Smoothly toggle between Default View and Password View
  const toggleLoginMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoginMode((prev) => (prev === 'default' ? 'password' : 'default'));
    setError('');
    setPassword('');
  };

  const handleGooglePress = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { signInWithGoogle } = await import('../utils/googleSignIn');
      const { idToken } = await signInWithGoogle();
      const res = await googleLoginApi(idToken);

      await AsyncStorage.setItem('authToken', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));

      dispatch(loginSuccess({ user: res.user, token: res.token }));
      dispatch(fetchSubscriptions(res.token));
      router.replace('/(tabs)');
    } catch (err) {
      const cancelled = err.code === 'SIGN_IN_CANCELLED' || err.message?.includes('cancelled');
      if (!cancelled) {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) return setError('Please enter your email address');
    if (!emailRegex.test(normalizedEmail)) return setError('Please enter a valid email address');

    try {
      setLoading(true);
      const res = await requestOTP({ email: normalizedEmail });
      router.push({
        pathname: '/otp-verify',
        params: {
          channel: res.channel || 'email',
          identifier: res.email || normalizedEmail,
          requiresName: String(!!res.requiresName),
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) return setError('Please enter email and password');

    setLoading(true);
    try {
      const res = await passwordLogin({
        email: normalizedEmail,
        password,
      });

      await AsyncStorage.setItem('authToken', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));

      dispatch(loginSuccess({ user: res.user, token: res.token }));
      dispatch(fetchSubscriptions(res.token));
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized || isAuthenticated) {
    return (
      <View style={styles.loadingScreen}>
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
        bounces={false}
      >
        {/* --- Top Brand Header --- */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Feather name="book-open" size={36} color="#4F46E5" />
          </View>
          <Text style={styles.appName}>ExamRoot</Text>
          <Text style={styles.tagline}>Your Path to Success</Text>
        </View>

        {/* --- Bottom Form Sheet --- */}
        <View style={styles.formSheet}>
          
          {loginMode === 'password' && (
            <TouchableOpacity onPress={toggleLoginMode} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#64748B" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.heading}>
            {loginMode === 'default' ? 'Welcome Back' : 'Sign In with Password'}
          </Text>
          <Text style={styles.subheading}>
            {loginMode === 'default' ? 'Sign in to continue your preparation' : 'Enter your email and password to securely login'}
          </Text>

          {/* Error Message */}
          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color="#EF4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loginMode === 'default' ? (
            /* --- DEFAULT VIEW (Google / OTP / Switch to Password) --- */
            <View>
              <View style={styles.actionGroup}>
                <TouchableOpacity
                  onPress={handleGooglePress}
                  disabled={googleLoading}
                  activeOpacity={0.8}
                  style={[styles.socialBtn, googleLoading && styles.disabledBtn]}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color="#374151" />
                  ) : (
                    <>
                      <View style={styles.googleIconWrapper}>
                        <Text style={styles.googleIconText}>G</Text>
                      </View>
                      <Text style={styles.socialBtnText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleLoginMode}
                  activeOpacity={0.8}
                  style={styles.outlineBtn}
                >
                  <Feather name="lock" size={18} color="#374151" style={{ marginRight: 8 }} />
                  <Text style={styles.outlineBtnText}>Continue with Password</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" style={styles.btnIcon} />
                    <Text style={styles.primaryBtnText}>Sending OTP...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Send Email OTP</Text>
                    <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIconRight} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* --- PASSWORD VIEW --- */
            <View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handlePasswordLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" style={styles.btnIcon} />
                    <Text style={styles.primaryBtnText}>Logging in...</Text>
                  </>
                ) : (
                  <Text style={styles.primaryBtnText}>Login Now</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footer}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' }, 
  loadingScreen: { flex: 1, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },

  /* Header Section */
  headerSection: {
    backgroundColor: '#0F172A',
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginTop: 6 },

  /* Bottom Form Sheet */
  formSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    marginTop: -30, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  
  /* Back Button for Password View */
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },

  heading: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subheading: { fontSize: 14, color: '#64748B', marginBottom: 28 },

  /* Buttons */
  actionGroup: { gap: 12 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIconText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  /* Divider */
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 11, color: '#94A3B8', fontWeight: '700', paddingHorizontal: 12, letterSpacing: 0.5 },

  /* Inputs */
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },

  /* Errors */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorIcon: { marginRight: 8 },
  errorText: { flex: 1, color: '#DC2626', fontSize: 13, fontWeight: '500' },

  /* Primary Button */
  primaryBtn: {
    backgroundColor: '#4F46E5', 
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledBtn: { opacity: 0.6, shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  btnIcon: { marginRight: 10 },
  btnIconRight: { marginLeft: 10 },

  /* Footer */
  footer: { textAlign: 'center', color: '#64748B', fontSize: 12, marginTop: 32, lineHeight: 18 },
  footerLink: { color: '#4F46E5', fontWeight: '600' },
});