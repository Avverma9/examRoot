import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Placeholder — replace with real saved questions from API/store
  const savedQuestions = [];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Saved Questions</Text>
        {savedQuestions.length > 0 && (
          <Text className="text-sm text-blue-600 font-medium">{savedQuestions.length} saved</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {savedQuestions.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-8 py-20">
            <View className="w-24 h-24 bg-amber-50 rounded-full items-center justify-center mb-6">
              <Feather name="bookmark" size={44} color="#f59e0b" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
              No saved questions yet
            </Text>
            <Text className="text-gray-500 text-center text-sm leading-6">
              Bookmark questions while practising to review them later. They'll all appear here.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="mt-8 bg-blue-600 px-8 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold text-base">Browse Questions</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Question List — populated once API is integrated */
          <View className="p-4">
            {savedQuestions.map((q, idx) => (
              <View
                key={idx}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
              >
                <Text className="text-gray-800 font-medium text-sm">{q.question}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
