import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../utils/baseUrl';

const PYQPage = () => {
  const router = useRouter();
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchText, setSearchText] = useState('');

  // ── Fetch distinct exam names for filter ────────────────────────────────
  useEffect(() => {
    fetchExams();
  }, []);

  // ── Fetch PYQ papers when exam is selected or search changes ────────────
  useEffect(() => {
    if (selectedExam || searchText.trim()) {
      fetchPapers();
    } else {
      setPapers([]);
    }
  }, [selectedExam, searchText]);

  const fetchExams = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/pyq/exams`);
      const data = await response.json();
      if (data.success) {
        setExams(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error.message);
    }
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedExam) params.append('examName', selectedExam);
      if (searchText.trim()) params.append('search', searchText);

      const url = `${BASE_URL}/api/pyq?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPapers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching PYQ papers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaperPress = (paperId) => {
    router.push({
      pathname: '/pyq-player',
      params: { paperId },
    });
  };

  const renderPaperCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => handlePaperPress(item._id)}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100"
      style={{ elevation: 2 }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {item.examName || 'PYQ Paper'}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {item.paperTitle || `Year: ${item.year}`}
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded">
              <Feather name="file-text" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 ml-1 font-semibold">
                {item.totalQuestions || 0} Q
              </Text>
            </View>
            <View className="flex-row items-center bg-purple-50 px-2 py-1 rounded">
              <Feather name="calendar" size={14} color="#7C3AED" />
              <Text className="text-xs text-purple-600 ml-1 font-semibold">
                {item.year}
              </Text>
            </View>
            {item.subject && (
              <View className="flex-row items-center bg-green-50 px-2 py-1 rounded">
                <Feather name="tag" size={14} color="#10B981" />
                <Text className="text-xs text-green-600 ml-1 font-semibold">
                  {item.subject}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Feather name="inbox" size={48} color="#D1D5DB" strokeWidth={1.5} />
      <Text className="text-gray-500 text-base font-semibold mt-4">
        {selectedExam ? 'No papers found' : 'Select an exam to view papers'}
      </Text>
      <Text className="text-gray-400 text-sm mt-1">
        {selectedExam
          ? 'Try a different exam or search term'
          : 'Choose from available exams above'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        scrollEnabled={false}
        className="flex-1"
        contentContainerStyle={{ flex: 1 }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Previous Year Questions
          </Text>

          {/* ── Search Bar ────────────────────────────────────────────── */}
          <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg mb-3">
            <Feather name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 text-gray-700 ml-2"
              placeholder="Search papers..."
              placeholderTextColor="#9CA3AF"
              onChangeText={setSearchText}
              value={searchText}
            />
          </View>

          {/* ── Exam Filter Chips ────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
            contentContainerStyle={{ paddingRight: 4 }}
          >
            {exams.map((exam) => (
              <TouchableOpacity
                key={exam}
                onPress={() => setSelectedExam(selectedExam === exam ? null : exam)}
                className={`px-3 py-2 rounded-full mr-2 border ${
                  selectedExam === exam
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedExam === exam ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {exam}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Papers List ───────────────────────────────────────────── */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : papers.length > 0 ? (
          <FlatList
            data={papers}
            renderItem={renderPaperCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 4, paddingBottom: 12 }}
            scrollEnabled={true}
          />
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PYQPage;
