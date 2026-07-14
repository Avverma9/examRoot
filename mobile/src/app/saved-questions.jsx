import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSavedQuestions, deleteSavedQuestion } from '../services/savedQuestionsApi';

const SOURCE_LABELS = {
  mock_test: { label: 'Mock Test', color: '#D97706', bg: '#FEF3C7' },
  practice_set: { label: 'Practice', color: '#059669', bg: '#D1FAE5' },
  test_series: { label: 'Test Series', color: '#2563EB', bg: '#DBEAFE' },
};

export default function SavedQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useSelector((state) => state.auth.token);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null); // expanded question _id

  const fetchQuestions = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getSavedQuestions(token, { limit: 100 });
      setQuestions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDelete = (id) => {
    Alert.alert('Remove Question', 'Remove this question from saved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deleteSavedQuestion(token, id);
            setQuestions(prev => prev.filter(q => q._id !== id));
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions(true);
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
        <Text className="text-lg font-bold text-white flex-1">Saved Questions</Text>
        {questions.length > 0 && (
          <View className="bg-orange-100 px-2.5 py-1 rounded-lg">
            <Text className="text-orange-700 text-xs font-bold">{questions.length} saved</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-400 text-sm mt-3">Loading saved questions...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={32} color="#EF4444" />
          <Text className="text-gray-700 font-semibold mt-3 text-center">{error}</Text>
          <TouchableOpacity onPress={() => fetchQuestions()} className="mt-4 bg-blue-600 px-6 py-2.5 rounded-xl">
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" colors={['#F97316']} />
          }
        >
          {questions.length === 0 ? (
            /* Empty State */
            <View className="flex-1 items-center justify-center px-8 py-20">
              <View className="w-24 h-24 bg-orange-50 rounded-full items-center justify-center mb-6">
                <Feather name="bookmark" size={44} color="#f97316" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
                No saved questions yet
              </Text>
              <Text className="text-gray-500 text-center text-sm leading-6">
                Save questions while practising mock tests or practice sets to review them here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                className="mt-8 bg-amber-500 px-8 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-base">Start Practicing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-4">
              {questions.map((q) => {
                const src = SOURCE_LABELS[q.sourceType] || SOURCE_LABELS.practice_set;
                const isExpanded = expandedId === q._id;
                const correctIdx = q.options?.indexOf(q.correctAnswer) ?? -1;

                return (
                  <View
                    key={q._id}
                    className="bg-white rounded-2xl mb-3 border border-gray-100 overflow-hidden"
                    style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                  >
                    {/* Source badge + delete */}
                    <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
                      <View className="flex-row items-center gap-2">
                        <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: src.bg }}>
                          <Text className="text-xs font-bold" style={{ color: src.color }}>{src.label}</Text>
                        </View>
                        {q.resourceTitle ? (
                          <Text className="text-xs text-gray-400 font-medium" numberOfLines={1}>{q.resourceTitle}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(q._id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Question text */}
                    <TouchableOpacity
                      className="px-4 pb-3"
                      onPress={() => setExpandedId(isExpanded ? null : q._id)}
                      activeOpacity={0.7}
                    >
                      <Text className="text-gray-800 font-semibold text-sm leading-5">
                        Q{q.questionIndex + 1}. {q.question}
                      </Text>

                      {/* Expand toggle */}
                      <View className="flex-row items-center mt-2">
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#94A3B8"
                        />
                        <Text className="text-xs text-gray-400 ml-1 font-medium">
                          {isExpanded ? 'Hide details' : 'Show answer & explanation'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded: options + explanation */}
                    {isExpanded && (
                      <View className="px-4 pb-4 border-t border-gray-50 pt-3">
                        {/* Options */}
                        {(q.options || []).map((opt, i) => {
                          const isCorrect = i === correctIdx;
                          return (
                            <View
                              key={i}
                              className="flex-row items-center py-2 px-3 rounded-xl mb-2"
                              style={{ backgroundColor: isCorrect ? '#ECFDF5' : '#F8FAFC', borderWidth: 1, borderColor: isCorrect ? '#A7F3D0' : '#E2E8F0' }}
                            >
                              <View
                                className="w-6 h-6 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: isCorrect ? '#10B981' : '#E2E8F0' }}
                              >
                                <Text className="text-xs font-bold" style={{ color: isCorrect ? '#fff' : '#64748B' }}>
                                  {String.fromCharCode(65 + i)}
                                </Text>
                              </View>
                              <Text
                                className="text-sm flex-1"
                                style={{ color: isCorrect ? '#065F46' : '#334155', fontWeight: isCorrect ? '700' : '500' }}
                              >
                                {opt}
                              </Text>
                              {isCorrect && <Feather name="check-circle" size={14} color="#10B981" />}
                            </View>
                          );
                        })}

                        {/* Explanation */}
                        {q.explanation ? (
                          <View className="bg-blue-50 rounded-xl p-3 mt-1 border border-blue-100">
                            <Text className="text-xs font-bold text-blue-700 mb-1">💡 EXPLANATION</Text>
                            <Text className="text-xs text-blue-800 leading-5">{q.explanation}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
