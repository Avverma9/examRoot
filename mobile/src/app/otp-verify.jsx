import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView,
  ScrollView, Platform, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyOTPAndLogin, resendOTP } from '../services/authApi';
import { loginSuccess } from '../store/slices/authSlice';

const OTP_EXPIRY_SECS = 600; // 10 min

export default function OTPVerifyScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();

  // Params from login.jsx
  const { channel, identifier, requiresName } = useLocalSearchParams();
  // channel: email
  // identifier: actual email string

  const isEmail = true;

  const [otp,          setOtp]          = useState('');
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [resending,    setResending]    = useState(false);
  const [message,      setMessage]      = useState({ text: '', type: '' }); // type: 'error' | 'success'
  const [timer,        setTimer]        = useState(OTP_EXPIRY_SECS);
  const [showName,     setShowName]     = useState(requiresName === 'true');

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const fmtTimer = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type });
    if (type === 'success') setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setMessage({ text: '', type: '' });
    if (!otp.trim())       return showMsg('Please enter the OTP');
    if (otp.length !== 6)  return showMsg('OTP must be 6 digits');
    if (showName && !name.trim()) return showMsg('Please enter your full name');

    try {
      setLoading(true);
      const payload = {
        otp,
        email: identifier,
        ...(showName ? { name: name.trim() } : {}),
      };

      const response = await verifyOTPAndLogin(payload);

      // Persist auth
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      dispatch(loginSuccess({ user: response.user, token: response.token }));
      router.replace('/(tabs)');
    } catch (err) {
      showMsg(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setResending(true);
      setMessage({ text: '', type: '' });
      await resendOTP({ email: identifier });
      setTimer(OTP_EXPIRY_SECS);
      setOtp('');
      showMsg('OTP resent successfully', 'success');
    } catch (err) {
      showMsg(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const maskedIdentifier = isEmail
    ? identifier?.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))
    : identifier?.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header banner */}
        <View style={styles.banner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.bannerContent}>
            <View style={styles.shieldWrap}>
              <Feather name="shield" size={36} color="#fff" />
            </View>
            <Text style={styles.bannerTitle}>
              Verify Email
            </Text>
            <Text style={styles.bannerSub}>{maskedIdentifier}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.hint}>
            We've sent a 6-digit OTP to your email.
            Enter it below to continue.
          </Text>

          {/* OTP input */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Enter OTP</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#CBD5E1"
                value={otp}
                onChangeText={(v) => {
                  if (/^\d*$/.test(v) && v.length <= 6) setOtp(v);
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {otp.length === 6 && (
                <Feather name="check-circle" size={18} color="#10B981" />
              )}
            </View>
            {/* Timer */}
            <View style={styles.timerRow}>
              <Feather name="clock" size={12} color={timer < 60 ? '#EF4444' : '#94A3B8'} />
              <Text style={[styles.timerText, timer < 60 && styles.timerRed]}>
                {timer > 0 ? `OTP expires in ${fmtTimer(timer)}` : 'OTP expired'}
              </Text>
            </View>
          </View>

          {/* Name input — only for new users */}
          {showName && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Your Full Name</Text>
              <View style={styles.inputRow}>
                <Feather name="user" size={18} color="#94A3B8" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>
          )}

          {/* Message */}
          {!!message.text && (
            <View style={[styles.msgBox, message.type === 'success' ? styles.msgSuccess : styles.msgError]}>
              <Feather
                name={message.type === 'success' ? 'check-circle' : 'alert-circle'}
                size={15}
                color={message.type === 'success' ? '#065F46' : '#DC2626'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.msgText, message.type === 'success' ? styles.msgTextSuccess : styles.msgTextError]}>
                {message.text}
              </Text>
            </View>
          )}

          {/* Verify button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || otp.length !== 6 || (showName && !name.trim())}
            activeOpacity={0.85}
            style={[
              styles.btn,
              (loading || otp.length !== 6 || (showName && !name.trim())) && styles.btnDisabled,
            ]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Verifying…</Text>
              </>
            ) : (
              <>
                <Feather name="check" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Verify & Continue</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the OTP?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={timer > 0 || resending}
              style={styles.resendBtn}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <>
                  <Feather
                    name="refresh-cw"
                    size={13}
                    color={timer > 0 ? '#CBD5E1' : '#D97706'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                    {timer > 0 ? `Resend in ${fmtTimer(timer)}` : 'Resend OTP'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          For your security, never share this OTP with anyone
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  // Banner
  banner: { backgroundColor: '#D97706', paddingTop: 52, paddingBottom: 36, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backBtn: { marginBottom: 16 },
  bannerContent: { alignItems: 'center' },
  shieldWrap: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: 16, marginBottom: 10 },
  bannerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Form
  form: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  hint: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20 },

  // Fields
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#F9FAFB' },
  icon: { marginRight: 10 },
  otpInput: { flex: 1, fontSize: 22, fontWeight: '800', letterSpacing: 6, color: '#0F172A', padding: 0 },
  textInput: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  timerRed: { color: '#EF4444' },

  // Messages
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 14 },
  msgSuccess: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  msgError:   { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  msgText: { flex: 1, fontSize: 13, fontWeight: '500' },
  msgTextSuccess: { color: '#065F46' },
  msgTextError:   { color: '#DC2626' },

  // Button
  btn: { backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#D97706', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Resend
  resendRow: { alignItems: 'center', marginTop: 20, gap: 8 },
  resendLabel: { fontSize: 13, color: '#64748B' },
  resendBtn: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '700', color: '#D97706' },
  resendTextDisabled: { color: '#CBD5E1' },

  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, paddingHorizontal: 32, marginTop: 8 },
});
