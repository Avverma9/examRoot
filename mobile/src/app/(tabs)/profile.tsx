import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const menuItems: { icon: keyof typeof Feather.glyphMap; title: string }[] = [
    { icon: 'bookmark', title: 'Saved Questions' },
    { icon: 'pie-chart', title: 'My Performance' },
    { icon: 'settings', title: 'Settings' },
    { icon: 'help-circle', title: 'Help & Support' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLogoutLoading(false);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-blue-600 px-4 pt-8 pb-6 items-center rounded-b-[30px]">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3">
          <Feather name="user" size={40} color="#2563EB" />
        </View>
        <Text className="text-2xl font-bold text-white">{user?.name || 'Student'}</Text>
        <Text className="text-blue-200 text-sm">{user?.email || 'email@example.com'}</Text>
      </View>

      {/* Menu List */}
      <View className="p-4 mt-2">
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
          >
            <View className="bg-gray-50 p-2 rounded-lg mr-4">
              <Feather name={item.icon} size={20} color="#4B5563" />
            </View>
            <Text className="text-base font-medium text-gray-700 flex-1">{item.title}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          disabled={logoutLoading}
          className="flex-row items-center bg-red-50 p-4 rounded-xl mt-4 border border-red-100"
        >
          {logoutLoading ? (
            <>
              <ActivityIndicator color="#DC2626" style={{ marginRight: 8 }} />
              <Text className="text-base font-bold text-red-600 ml-4">Logging out...</Text>
            </>
          ) : (
            <>
              <Feather name="log-out" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text className="text-base font-bold text-red-600 ml-4">Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}