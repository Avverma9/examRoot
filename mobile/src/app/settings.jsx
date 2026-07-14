import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 
import { useSelector, useDispatch } from 'react-redux'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile, updatePassword } from '../services/authApi';
import { setUser } from '../store/slices/authSlice';

const APP_VERSION = '1.0.0';

const SectionHeader = ({ title }) => (
  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-5">
    {title}
  </Text>
);

const RowItem = ({ icon, label, right, onPress, danger }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    className="flex-row items-center bg-white px-4 py-4 border-b border-gray-50 active:bg-gray-50"
  >
    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
      <Feather name={icon} size={16} color={danger ? '#ef4444' : '#4b5563'} />
    </View>
    <Text className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-800'}`}>
      {label}
    </Text>
    {right}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();

  const user  = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [name,         setName]         = useState(user?.name || '');
  const [language,     setLanguage]     = useState(user?.preferredLanguage || 'en');
  const [notifications, setNotifications] = useState(true);
  const [saving,       setSaving]       = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving,  setPasswordSaving]  = useState(false);
  const [passwordError,   setPasswordError]   = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    try {
      setSaving(true);
      const res = await updateProfile(token, {
        name:              name.trim(),
        preferredLanguage: language,
      });
      if (res.success) {
        dispatch(setUser({ ...user, name: name.trim(), preferredLanguage: language }));
        Alert.alert('Saved', 'Your profile has been updated.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      return setPasswordError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }
    if (user?.hasPassword && !currentPassword) {
      return setPasswordError('Please enter your current password to set a new one.');
    }

    try {
      setPasswordSaving(true);
      const payload = { newPassword };
      if (user?.hasPassword) {
        payload.currentPassword = currentPassword;
      }

      const res = await updatePassword(token, payload);
      dispatch(setUser(res.user)); // Update user in store (e.g., hasPassword flag)
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open link.')
    );
  };

  return (
    <View className="flex-1 bg-orange-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-orange-500 border-b border-orange-600">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white flex-1">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100 shadow-sm">
          <View className="px-4 pt-4 pb-3">
            <Text className="text-xs text-gray-400 mb-1">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
              className="text-gray-800 text-sm font-medium border-b border-gray-200 pb-2"
            />
          </View>
          <View className="px-4 pb-4">
            <Text className="text-xs text-gray-400 mb-1">Email</Text>
            <Text className="text-gray-500 text-sm">{user?.email || '—'}</Text>
          </View>
        </View>

        {/* ── Preferences ── */}
        <SectionHeader title="Preferences" />
        <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100 shadow-sm">
          {/* Language */}
          <View className="px-4 py-4 border-b border-gray-50">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
                <Feather name="globe" size={16} color="#4b5563" />
              </View>
              <Text className="text-sm font-medium text-gray-800">Language</Text>
            </View>
            <View className="flex-row mt-1 ml-11">
              <TouchableOpacity
                onPress={() => setLanguage('en')}
                className={`flex-row items-center px-4 py-2 rounded-lg mr-3 border ${
                  language === 'en'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${language === 'en' ? 'text-white' : 'text-gray-600'}`}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguage('hi')}
                className={`flex-row items-center px-4 py-2 rounded-lg border ${
                  language === 'hi'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${language === 'hi' ? 'text-white' : 'text-gray-600'}`}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications */}
          <View className="flex-row items-center px-4 py-4">
            <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
              <Feather name="bell" size={16} color="#4b5563" />
            </View>
            <Text className="text-sm font-medium text-gray-800 flex-1">Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Security ── */}
        <SectionHeader title="Security" />
        <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100 shadow-sm">
          {user?.hasPassword && (
            <View className="px-4 pt-4 pb-3 border-b border-gray-50">
              <Text className="text-xs text-gray-400 mb-1">Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                className="text-gray-800 text-sm font-medium border-b border-gray-200 pb-2"
              />
            </View>
          )}
          <View className="px-4 pt-4 pb-3 border-b border-gray-50">
            <Text className="text-xs text-gray-400 mb-1">New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="text-gray-800 text-sm font-medium border-b border-gray-200 pb-2"
            />
          </View>
          <View className="px-4 pt-4 pb-3">
            <Text className="text-xs text-gray-400 mb-1">Confirm New Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="text-gray-800 text-sm font-medium border-b border-gray-200 pb-2"
            />
          </View>
          {!!passwordError && (
            <Text className="text-red-500 text-xs px-4 pt-2 pb-2">{passwordError}</Text>
          )}
          {!!passwordSuccess && (
            <Text className="text-green-600 text-xs px-4 pt-2 pb-2">{passwordSuccess}</Text>
          )}
          <View className="p-4 border-t border-gray-50">
            <TouchableOpacity
              onPress={handlePasswordUpdate}
              disabled={passwordSaving}
              className="bg-gray-800 py-3 rounded-xl items-center justify-center flex-row"
            >
              {passwordSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Feather name="key" size={14} color="#ffffff" />
                  <Text className="text-white font-bold text-sm ml-2">
                    {user?.hasPassword ? 'Change Password' : 'Set Password'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Legal ── */}
        <SectionHeader title="Legal" />
        <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100 shadow-sm">
          <RowItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => openUrl('https://examroot.in/privacy-policy')}
            right={<Feather name="external-link" size={14} color="#9ca3af" />}
          />
          <RowItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => openUrl('https://examroot.in/terms')}
            right={<Feather name="external-link" size={14} color="#9ca3af" />}
          />
        </View>

        {/* ── App Info ── */}
        <SectionHeader title="App" />
        <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100 shadow-sm">
          <RowItem
            icon="info"
            label="Version"
            right={<Text className="text-xs text-gray-400">{APP_VERSION}</Text>}
          />
        </View>

        {/* Save Button */}
        <View className="px-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-blue-600 py-4 rounded-xl items-center justify-center flex-row"
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name="save" size={16} color="#ffffff" />
                <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
