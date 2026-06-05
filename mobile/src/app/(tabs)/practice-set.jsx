import { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPracticeSets } from '../../store/slices/practiceSetSlice'
import { useRouter } from 'expo-router'

const LEVEL_COLORS = {
  easy: { bg: 'bg-green-100', text: 'text-green-700' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  hard: { bg: 'bg-red-100', text: 'text-red-700' },
}

export default function PracticeSetScreen() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { items: practiceSets, status, error } = useSelector((state) => state.practiceSet)

  useEffect(() => {
    dispatch(fetchPracticeSets())
  }, [dispatch])

  if (status === 'loading') {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    )
  }

  if (status === 'failed') {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Feather name="wifi-off" size={40} color="#EF4444" />
        <Text className="text-red-500 font-bold text-lg mt-3">Failed to load practice sets</Text>
        <TouchableOpacity onPress={() => dispatch(fetchPracticeSets())} className="mt-4 bg-amber-600 px-6 py-2 rounded-lg">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
        {error ? <Text className="text-red-500 mt-2">{error}</Text> : null}
      </View>
    )
  }

  const renderItem = ({ item }) => {
    const level = item.level || 'easy'
    const colors = LEVEL_COLORS[level] || LEVEL_COLORS.easy

    return (
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/practice-set-player', params: { practice: JSON.stringify(item) } })}
        className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-base font-bold text-gray-800 flex-1" numberOfLines={2}>
            {item.title}
          </Text>
          <View className={`${colors.bg} px-2 py-1 rounded-md ml-2`}>
            <Text className={`${colors.text} text-xs font-bold capitalize`}>{level}</Text>
          </View>
        </View>

        <Text className="text-gray-500 text-sm mb-3">
          {item.subject} {item.topic ? `• ${item.topic}` : ''}
        </Text>

        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
          <View className="flex-row items-center">
            <Feather name="help-circle" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{item.totalQuestions || 0} Questions</Text>
          </View>
          <View className="bg-amber-600 px-4 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-bold">Practice</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      {practiceSets.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="book" size={40} color="#9CA3AF" />
          <Text className="text-gray-400 mt-3 font-semibold">No practice sets available</Text>
        </View>
      ) : (
        <FlatList
          data={practiceSets}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}
