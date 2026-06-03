import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Asset } from 'expo-asset';

const { width, height } = Dimensions.get('window');

let _hasSeenIntro = false;
export function setHasSeenIntro() { _hasSeenIntro = true; }
export function getHasSeenIntro() { return _hasSeenIntro; }

export default function IntroScreen() {
  const [videoUri, setVideoUri] = useState(null);

  useEffect(() => {
    loadVideo();
    const timer = setTimeout(handleFinish, 15000);
    return () => clearTimeout(timer);
  }, []);

  const loadVideo = async () => {
    try {
      const asset = await Asset.fromModule(require('../../assets/intro_video.mp4')).downloadAsync();
      setVideoUri(asset.localUri);
    } catch {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setHasSeenIntro();
    router.replace('/(tabs)');
  };

  const buildHtml = (uri) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000; overflow:hidden; }
    video { width:100%; height:100%; object-fit:cover; }
  </style>
</head>
<body>
  <video id="v" playsinline webkit-playsinline autoplay muted preload="auto">
    <source src="${uri}" type="video/mp4">
  </video>
  <script>
    var v = document.getElementById('v');
    v.play().catch(function(){});
    v.addEventListener('ended', function() {
      window.ReactNativeWebView.postMessage('ended');
    });
  </script>
</body>
</html>`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />

      {videoUri && (
        <WebView
          source={{ html: buildHtml(videoUri) }}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          scrollEnabled={false}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          onMessage={(e) => {
            if (e.nativeEvent.data === 'ended') handleFinish();
          }}
        />
      )}

      {/* Logo overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        pointerEvents="none"
      />
      <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
        <Image
          source={require('../../assets/app-logo.jpeg')}
          style={{ width: 90, height: 90, borderRadius: 18 }}
          resizeMode="cover"
        />
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 14, letterSpacing: 1 }}>
          Exam<Text style={{ color: '#F59E0B' }}>Root</Text>
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, fontWeight: '500' }}>
          Your Success, Our Mission
        </Text>
      </View>

      {/* Bottom skip button */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.97)']}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 180, justifyContent: 'flex-end',
          alignItems: 'center', paddingBottom: 52,
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#F59E0B',
            paddingHorizontal: 40, paddingVertical: 12,
            borderRadius: 50,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Skip Intro</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
