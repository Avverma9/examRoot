import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyOTPAndLogin, requestOTP } from '../services/authApi';
import { loginSuccess, setError } from '../store/slices/authSlice';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const { email, requiresName } = params;

  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [showNameInput, setShowNameInput] = useState(requiresName === 'true');
  const [nameFocused, setNameFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);

  useEffect(() => {
    // Start timer for OTP expiry
    setTimer(600); // 10 minutes in seconds
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResendOTP = async () => {
    try {
      setError('');
      setLoading(true);
      await requestOTP(email);
      setTimer(600); // Reset timer
      setOtp('');
      // Show success message
      setError('✓ OTP resent successfully');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');

    // Validation
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    if (showNameInput && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        email,
        otp,
      };

      if (showNameInput) {
        payload.name = name;
      }

      const response = await verifyOTPAndLogin(email, otp, showNameInput ? name : null);

      // Save token and user to storage
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Update Redux
      dispatch(loginSuccess({
        user: response.user,
        token: response.token,
      }));

      // Navigate to home
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-gradient-to-b from-amber-600 to-amber-500 px-6 pt-12 pb-12 rounded-b-[40px]">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="items-center">
            <View className="bg-white/20 p-4 rounded-2xl mb-4">
              <Feather name="shield-check" size={40} color="white" />
            </View>
            <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
              Verify Email
            </Text>
            <Text className="text-amber-100 text-sm font-semibold">
              {email}
            </Text>
          </View>
        </View>

        {/* Form Container */}
        <View className="px-6 pt-8 pb-8 flex-1">
          <Text className="text-gray-700 text-base font-medium mb-6">
            We've sent a 6-digit code to your email. Enter it below to continue.
          </Text>

          {/* OTP Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wider">
              Enter OTP
            </Text>
            <View
              className={`flex-row items-center px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                otpFocused
                  ? 'bg-white border-amber-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Feather 
                name="lock" 
                size={20} 
                color={otpFocused ? '#F59E0B' : '#D1D5DB'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ flex: 1, fontSize: 20, letterSpacing: 4, fontWeight: 'bold' }}
                placeholder="000000"
                placeholderTextColor="#D1D5DB"
                value={otp}
                onChangeText={(value) => {
                  if (/^\d*$/.test(value) && value.length <= 6) {
                    setOtp(value);
                  }
                }}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              OTP expires in {formatTime(timer)}
            </Text>
          </View>

          {/* Name Input (if new user) */}
          {showNameInput && (
            <View className="mb-6">
              <Text className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wider">
                Full Name
              </Text>
              <View
                className={`flex-row items-center px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                  nameFocused
                    ? 'bg-white border-amber-500'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Feather 
                  name="user" 
                  size={20} 
                  color={nameFocused ? '#F59E0B' : '#D1D5DB'}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  editable={!loading}
                />
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className={`${error.includes('✓') ? 'bg-green-50 border border-green-200' : 'bg-red-50'} px-4 py-3 rounded-xl mb-6 flex-row items-center`}>
              <Feather 
                name={error.includes('✓') ? 'check-circle' : 'alert-circle'} 
                size={18} 
                color={error.includes('✓') ? '#10B981' : '#EF4444'} 
                style={{ marginRight: 8 }} 
              />
              <Text className={error.includes('✓') ? 'text-green-600' : 'text-red-600'} style={{ fontWeight: '500', flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={loading || !otp || otp.length !== 6 || (showNameInput && !name)}
            className={`py-4 rounded-2xl items-center justify-center flex-row ${
              loading || !otp || otp.length !== 6 || (showNameInput && !name)
                ? 'bg-gray-300'
                : 'bg-amber-600'
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Verifying...</Text>
              </>
            ) : (
              <>
                <Feather name="check" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Verify & Login</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View className="mt-6 items-center">
            <Text className="text-gray-600 text-sm mb-3">Didn't receive the code?</Text>
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={loading || timer > 0}
              className="flex-row items-center"
            >
              <Feather 
                name="send" 
                size={16} 
                color={loading || timer > 0 ? '#9CA3AF' : '#F59E0B'} 
                style={{ marginRight: 6 }}
              />
              <Text className={`font-bold text-base ${loading || timer > 0 ? 'text-gray-400' : 'text-amber-600'}`}>
                {timer > 0 ? `Resend in ${Math.ceil(timer / 60)}m` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8 items-center">
          <Text className="text-gray-500 text-xs text-center leading-5">
            For security, never share your OTP with anyone
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
