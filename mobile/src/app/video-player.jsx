import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'

export default function VideoPlayer() {
  const { video } = useLocalSearchParams()
  const item = JSON.parse(video)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
        video { width: 100%; height: 100vh; object-fit: contain; }
      </style>
    </head>
    <body>
      <video src="${item.videoUrl}" controls autoplay playsinline></video>
    </body>
    </html>
  `

  return (
    <View className="flex-1 bg-black">
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}>
        <WebView
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onLoad={() => setLoading(false)}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-10 left-4 bg-black/50 p-2 rounded-full"
      >
        <Feather name="arrow-left" size={20} color="white" />
      </TouchableOpacity>

      <ScrollView className="flex-1 bg-white p-4">
        <View className="flex-row items-center mb-2">
          <View className="bg-blue-50 px-2 py-1 rounded-md">
            <Text className="text-blue-600 text-xs font-bold">{item.category}</Text>
          </View>
          {item.duration && (
            <Text className="text-gray-400 text-xs ml-2">{item.duration}</Text>
          )}
        </View>
        <Text className="text-lg font-bold text-gray-800">{item.videoTitle}</Text>
        {item.views != null && (
          <Text className="text-gray-400 text-sm mt-1">{item.views.toLocaleString()} views</Text>
        )}
        {item.description ? (
          <Text className="text-gray-600 text-sm mt-3 leading-5">{item.description}</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}
