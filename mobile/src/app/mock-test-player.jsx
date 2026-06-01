import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, BackHandler, SafeAreaView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

export default function MockTestPlayer() {
  const { test } = useLocalSearchParams()
  const router = useRouter()
  const parsedTest = test ? JSON.parse(test) : { questions: [], duration: 0 }
  const questions = parsedTest.questions || []

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(parsedTest.duration * 60)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef(null)
  const scrollViewRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); setSubmitted(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitted) { confirmExit(); return true }
      return false
    })
    return () => back.remove()
  }, [submitted])

  const confirmExit = () => {
    Alert.alert('Exit Test', 'Are you sure you want to exit? Progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => { clearInterval(timerRef.current); router.back() } },
    ])
  }

  const handleSubmit = () => {
    Alert.alert('Submit Test', 'Are you sure you want to submit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => { clearInterval(timerRef.current); setSubmitted(true) } },
    ])
  }

  const formatTime = (s) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getScore = () => questions.filter((q, i) => answers[i] === q.correctAnswer).length

  const getStatusColor = (index) => {
    if (current === index) return 'bg-blue-600 border-blue-600'
    if (answers[index]) return 'bg-emerald-500 border-emerald-500'
    return 'bg-white border-gray-300'
  }

  const getStatusTextColor = (index) => {
    if (current === index || answers[index]) return 'text-white'
    return 'text-gray-600'
  }

  if (submitted) {
    const score = getScore()
    const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">Performance Report</Text>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className={`w-24 h-24 items-center justify-center mb-4 rounded-full ${percent >= 60 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Feather name={percent >= 60 ? 'award' : 'pie-chart'} size={40} color={percent >= 60 ? '#10B981' : '#EF4444'} />
            </View>
            <Text className="text-4xl font-extrabold text-gray-900">
              {score} <Text className="text-xl text-gray-400">/ {questions.length}</Text>
            </Text>
            <Text className="text-gray-500 font-medium mt-1">Accuracy: {percent}%</Text>
          </View>

          <Text className="text-lg font-bold text-gray-800 mb-4">Detailed Analysis</Text>

          <View className="gap-4 pb-10">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer
              const isSkipped = !answers[i]
              return (
                <View key={i} className={`bg-white p-5 rounded-xl shadow-sm border ${isSkipped ? 'border-gray-200' : isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
                  <View className="flex-row justify-between items-start mb-3">
                    <Text className="text-gray-500 font-bold text-xs">QUESTION {i + 1}</Text>
                    <View className={`px-2 py-1 rounded ${isSkipped ? 'bg-gray-100' : isCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <Text className={`font-bold text-xs ${isSkipped ? 'text-gray-600' : isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isSkipped ? 'SKIPPED' : isCorrect ? '+1.0' : '-0.25'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-800 font-semibold mb-4 text-base">{q.question}</Text>

                  <View className="gap-2">
                    <View className="flex-row items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Feather name={isCorrect ? 'check-circle' : 'x-circle'} size={18} color={isCorrect ? '#10B981' : '#EF4444'} />
                      <Text className="ml-3 font-medium text-gray-700 flex-1">
                        {answers[i] || 'Did not answer'}
                      </Text>
                    </View>
                    {!isCorrect && (
                      <View className="flex-row items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                        <Feather name="check-circle" size={18} color="#10B981" />
                        <Text className="ml-3 font-medium text-emerald-800 flex-1">{q.correctAnswer}</Text>
                      </View>
                    )}
                  </View>

                  {q.explanation ? (
                    <View className="mt-4 pt-4 border-t border-gray-100">
                      <Text className="text-xs font-bold text-gray-400 mb-1">SOLUTION</Text>
                      <Text className="text-gray-600 text-sm leading-5">{q.explanation}</Text>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        </ScrollView>

        <View className="p-4 bg-white border-t border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 py-3.5 rounded-xl items-center">
            <Text className="text-white font-bold text-lg">Close Report</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const q = questions[current]
  if (!q) return null

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row justify-between items-center border-b border-gray-200">
        <TouchableOpacity onPress={confirmExit}>
          <Feather name="x" size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="font-bold text-gray-800">{current + 1} / {questions.length}</Text>
        <View className={`px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-100' : 'bg-blue-50'}`}>
          <Text className={`font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Question palette */}
      <View className="bg-white border-b border-gray-200 py-2">
        <ScrollView horizontal ref={scrollViewRef} showsHorizontalScrollIndicator={false} className="px-2">
          {questions.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrent(i)}
              className={`w-10 h-10 rounded-full items-center justify-center mx-1.5 border-2 ${getStatusColor(i)}`}
            >
              <Text className={`font-bold text-sm ${getStatusTextColor(i)}`}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Question */}
      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-sm font-bold text-gray-400 tracking-wider">QUESTION {current + 1}</Text>
          <View className="flex-row items-center">
            <Text className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mr-2">+1.0</Text>
            <Text className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">-0.25</Text>
          </View>
        </View>

        <Text className="text-lg font-semibold text-gray-800 leading-7 mb-8">{q.question}</Text>

        <View className="gap-3 mb-10">
          {q.options.map((opt, i) => {
            const isSelected = answers[current] === opt
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => setAnswers({ ...answers, [current]: opt })}
                className={`flex-row items-center p-4 rounded-xl border-2 ${isSelected ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'}`}
              >
                <View className={`w-5 h-5 items-center justify-center mr-3 rounded-full border-2 ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                  {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </View>
                <Text className={`flex-1 font-medium text-base ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{opt}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => { const a = { ...answers }; delete a[current]; setAnswers(a) }}
          className="px-4 py-3"
        >
          <Text className="text-gray-500 font-bold">Clear</Text>
        </TouchableOpacity>

        <View className="flex-row gap-3">
          {current < questions.length - 1 ? (
            <TouchableOpacity
              onPress={() => setCurrent((c) => c + 1)}
              className="bg-blue-600 px-6 py-3 rounded-lg flex-row items-center"
            >
              <Text className="text-white font-bold text-base mr-1">Save & Next</Text>
              <Feather name="chevron-right" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSubmit} className="bg-emerald-500 px-8 py-3 rounded-lg">
              <Text className="text-white font-bold text-base">Submit Test</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
