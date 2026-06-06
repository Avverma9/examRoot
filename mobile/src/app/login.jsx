import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import { requestOTP } from '../services/authApi';

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
      // const response = await requestOTP(email);
      
      // Simulate API Call
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      router.push({
        pathname: '/otp-verify',
        params: {
          email,
          requiresName: 'false', // Replace with response.requiresName
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
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section - Modern & Clean */}
        <View className="px-6 pt-24 pb-6 items-center">
          <View className="bg-amber-50 p-5 rounded-full mb-5 border border-amber-100">
            <Feather name="book-open" size={42} color="#D97706" />
          </View>
          <Text className="text-slate-900 text-4xl font-extrabold tracking-tight mb-2">
            ExamRoot
          </Text>
          <Text className="text-slate-500 text-base font-medium">
            Your Path to Success
          </Text>
        </View>

        {/* Form Container */}
        <View className="px-6 pt-4 pb-8 flex-1">
          <View className="mb-8 items-center">
            <Text className="text-2xl font-bold text-slate-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-slate-500 text-base text-center">
              Sign in with your email to continue your preparation
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-slate-700 font-semibold text-sm mb-2 ml-1">
              Email Address
            </Text>
            <View
              className={`flex-row items-center px-4 py-4 rounded-2xl border-2 transition-all ${
                emailFocused
                  ? 'bg-white border-amber-500'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Feather 
                name="mail" 
                size={20} 
                color={emailFocused ? '#D97706' : '#94A3B8'}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: '#0F172A' }}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
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
          {error ? (
            <View className="bg-red-50 px-4 py-3 rounded-2xl mb-6 flex-row items-center border border-red-100">
              <Feather name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="text-red-600 font-medium flex-1 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleRequestOTP}
            disabled={loading}
            activeOpacity={0.8}
            className={`py-4 rounded-2xl items-center justify-center flex-row shadow-sm ${
              loading ? 'bg-amber-400' : 'bg-amber-600'
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-lg">Sending OTP...</Text>
              </>
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Send OTP</Text>
                <Feather name="arrow-right" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Secure Info Box */}
          <View className="mt-8 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 flex-row items-center">
            <View className="bg-white p-2 rounded-full shadow-sm mr-3">
              <Feather name="shield" size={18} color="#D97706" />
            </View>
            <Text className="text-slate-600 font-medium flex-1 text-sm leading-5">
              We'll send a secure one-time password to verify your email.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 pb-10 items-center">
          <Text className="text-slate-400 text-xs text-center leading-5 mb-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
          <View className="h-1 bg-slate-200 w-12 rounded-full" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}