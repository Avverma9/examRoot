import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import * as ScreenOrientation from 'expo-screen-orientation'
import { API_URLS } from '../config/app.config';
import { saveProgress, completeProgress } from '../services/progressApi'

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  if (!url) return null
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default function VideoPlayer() {
  const { video }  = useLocalSearchParams()
  const item       = JSON.parse(video)
  const router     = useRouter()
  const token      = useSelector((state) => state.auth.token)

  const [loading,   setLoading]   = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const startTimeRef              = useRef(Date.now())
  const trackedRef                = useRef(false)

  // Check if it's a YouTube URL
  const youtubeVideoId = getYouTubeVideoId(item.videoUrl || item.youtubeUrl)
  const isYouTube = !!youtubeVideoId

  // Lock to landscape on mount, restore on unmount
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
      } catch (error) {
        console.warn('Could not lock orientation:', error)
      }
    }

    lockLandscape()

    return () => {
      ScreenOrientation.unlockAsync().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!item?._id) return

    fetch(`${API_URLS.BASE}/videos/${item._id}/view`, { method: 'PATCH' }).catch(() => {})

    if (token) {
      saveProgress(token, {
        resourceId:    item._id,
        resourceType:  'video',
        resourceTitle: item.videoTitle || item.title || '',
        currentQuestion: 0,
        totalQuestions:  1,
        answeredCount:   0,
      })
    }

    return () => {
      if (!token || trackedRef.current) return
      trackedRef.current = true
      const watchedSec = Math.round((Date.now() - startTimeRef.current) / 1000)
      if (watchedSec >= 10) {
        completeProgress(token, {
          resourceId:    item._id,
          resourceType:  'video',
          status:        'completed',
        })
      }
    }
  }, [item._id, token])

  // YouTube embed HTML
  const youtubeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; }
        .video-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          height: 0;
        }
        iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="video-container">
        <iframe
          src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </body>
    </html>
  `

  // Direct video HTML
  const directVideoHtml = `
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

  const html = isYouTube ? youtubeHtml : directVideoHtml

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
        <WebView
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoad={() => setLoading(false)}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-4 left-4 bg-black/70 p-3 rounded-full"
        style={{ zIndex: 1000 }}
      >
        <Feather name="x" size={24} color="white" />
      </TouchableOpacity>

      <View className="absolute bottom-4 left-4 right-4 bg-black/70 p-3 rounded-lg" style={{ zIndex: 1000 }}>
        <Text className="text-white font-bold text-base" numberOfLines={1}>
          {item.videoTitle || item.title || 'Video'}
        </Text>
        {item.category && (
          <Text className="text-gray-300 text-xs mt-1">{item.category}</Text>
        )}
      </View>
    </View>
  )
}
