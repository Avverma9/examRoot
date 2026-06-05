import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { requestOTP } from '../services/authApi';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestOTP = async () => {
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      const response = await requestOTP(email);
      
      // Navigate to OTP screen with email and requiresName flag
      router.push({
        pathname: '/otp-verify',
        params: {
          email,
          requiresName: response.requiresName ? 'true' : 'false',
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
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
        <View className="bg-gradient-to-b from-amber-600 to-amber-500 px-6 pt-20 pb-12 rounded-b-[40px]">
          <View className="items-center mb-4">
            <View className="bg-white/20 p-4 rounded-2xl mb-4">
              <Feather name="mail" size={40} color="white" />
            </View>
            <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
              ExamRoot
            </Text>
            <Text className="text-amber-100 text-base font-semibold">
              Your Path to Success
            </Text>
          </View>
        </View>

        {/* Form Container */}
        <View className="px-6 pt-12 pb-8 flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-extrabold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-base font-medium">
              Sign in with your email to continue
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wider">
              Email Address
            </Text>
            <View
              className={`flex-row items-center px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                emailFocused
                  ? 'bg-white border-amber-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Feather 
                name="mail" 
                size={20} 
                color={emailFocused ? '#F59E0B' : '#D1D5DB'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ flex: 1, fontSize: 16 }}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 px-4 py-3 rounded-xl mb-6 flex-row items-center">
              <Feather name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="text-red-600 font-medium flex-1">{error}</Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleRequestOTP}
            disabled={loading}
            className={`py-4 rounded-2xl items-center justify-center flex-row ${
              loading ? 'bg-amber-400' : 'bg-amber-600'
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Sending OTP...</Text>
              </>
            ) : (
              <>
                <Feather name="arrow-right" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Send OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View className="mt-8 bg-blue-50 px-4 py-4 rounded-2xl border border-blue-200">
            <View className="flex-row items-flex-start">
              <Feather name="info" size={18} color="#3B82F6" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="text-blue-700 font-medium flex-1 text-sm leading-5">
                We'll send a one-time password to verify your email
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8 items-center">
          <Text className="text-gray-600 text-xs text-center leading-5 mb-3">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
          <View className="h-0.5 bg-gray-200 w-16" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
