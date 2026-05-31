import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 85;
const REEL_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// ── Data ──────────────────────────────────────────────────────────────────────
const REELS_DATA = [
  {
    id: '1',
    title: 'Maths Trick: Fast Multiplication in 3 Seconds! 🧠⚡️ #SSC',
    tutor: '@MathsWizard',
    likes: '12K',
    comments: '340',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: '2',
    title: 'Top 5 Synonyms for "Important" 📚 Boost your English Vocab',
    tutor: '@LearnEnglish',
    likes: '8.5K',
    comments: '120',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  },
  {
    id: '3',
    title: 'Polity Shorts: Article 14 to 18 of Indian Constitution TRICK 🇮🇳',
    tutor: '@GKTricks',
    likes: '20K',
    comments: '890',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  },
];

// ── HTML Builder ──────────────────────────────────────────────────────────────
const buildVideoHtml = (videoUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>
</head>
<body>
  <video id="vid" loop muted playsinline webkit-playsinline preload="metadata">
    <source src="${videoUrl}" type="video/mp4">
  </video>
  <script>
    var vid = document.getElementById('vid');
    function handleMsg(e) {
      if (e.data === 'play')  vid.play().catch(function(){});
      if (e.data === 'pause') { vid.pause(); vid.currentTime = 0; }
    }
    // Android uses document, iOS uses window
    document.addEventListener('message', handleMsg);
    window.addEventListener('message', handleMsg);
  </script>
</body>
</html>
`;

// ── ReelVideo Component ───────────────────────────────────────────────────────
const ReelVideo = React.memo(({ item, isActive }) => {
  const webviewRef = useRef(null);
  const isLoadedRef = useRef(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const sendVideoCommand = useCallback((cmd) => {
    if (!isLoadedRef.current) return;
    webviewRef.current?.injectJavaScript(
      `document.getElementById('vid').${
        cmd === 'play'
          ? "play().catch(function(){})"
          : "pause(); document.getElementById('vid').currentTime=0"
      }; true;`
    );
  }, []);

  // Fires when isActive changes (e.g. user scrolls)
  React.useEffect(() => {
    sendVideoCommand(isActive ? 'play' : 'pause');
  }, [isActive, sendVideoCommand]);

  // ✅ Fix: Play immediately after WebView has loaded (handles first render)
  const onWebViewLoadEnd = useCallback(() => {
    isLoadedRef.current = true;
    if (isActive) sendVideoCommand('play');
  }, [isActive, sendVideoCommand]);

  return (
    <View style={{ height: REEL_HEIGHT, width: '100%' }} className="bg-black overflow-hidden">

      {/* Video Player */}
      <WebView
        ref={webviewRef}
        key={item.id}
        source={{ html: buildVideoHtml(item.videoUrl) }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={false}
        onLoadEnd={onWebViewLoadEnd}
      />

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0.3, 0.65, 1]}
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: REEL_HEIGHT * 0.65,
        }}
        pointerEvents="none"
      />

      {/* Right Side Actions */}
      <View
        className="absolute right-3 z-10 items-center gap-6"
        style={{ bottom: 100 }}
      >
        {/* Avatar with Follow "+" */}
        <View className="items-center mb-1">
          <View className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center border-2 border-white">
            <Text className="text-white font-bold text-base">
              {item.tutor[1].toUpperCase()}
            </Text>
          </View>
          <View className="absolute -bottom-2 w-5 h-5 bg-red-500 rounded-full border border-white items-center justify-center">
            <Feather name="plus" size={10} color="white" />
          </View>
        </View>

        {/* Like */}
        <TouchableOpacity
          className="items-center"
          activeOpacity={0.75}
          onPress={() => setLiked((l) => !l)}
        >
          <Feather name="heart" size={30} color={liked ? '#ef4444' : 'white'} />
          <Text className="text-white text-xs font-bold mt-0.5">{item.likes}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity className="items-center" activeOpacity={0.75}>
          <Feather name="message-circle" size={30} color="white" />
          <Text className="text-white text-xs font-bold mt-0.5">{item.comments}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark */}
        <TouchableOpacity
          className="items-center"
          activeOpacity={0.75}
          onPress={() => setSaved((s) => !s)}
        >
          <Feather name="bookmark" size={27} color={saved ? '#facc15' : 'white'} />
          <Text className="text-white text-xs font-bold mt-0.5">Save</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity className="items-center" activeOpacity={0.75}>
          <Feather name="share-2" size={27} color="white" />
          <Text className="text-white text-xs font-bold mt-0.5">Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View className="absolute bottom-5 left-4 z-10" style={{ right: 72 }}>
        {/* Tutor row */}
        <View className="flex-row items-center mb-2 flex-wrap">
          <Text className="text-white font-bold text-base mr-2">{item.tutor}</Text>
          <TouchableOpacity
            className="border border-white/70 px-3 py-0.5 rounded-full"
            activeOpacity={0.75}
          >
            <Text className="text-white text-xs font-semibold">Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text
          className="text-white text-sm leading-5 mb-2.5 font-medium"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Audio badge */}
        <View className="flex-row items-center bg-black/50 self-start px-2.5 py-1.5 rounded-full border border-white/20">
          <Feather name="music" size={11} color="white" />
          <Text className="text-white text-xs ml-1.5">Original Audio · ExamRoot</Text>
        </View>
      </View>
    </View>
  );
});

ReelVideo.displayName = 'ReelVideo';

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => (
      <ReelVideo item={item} isActive={index === activeIndex} />
    ),
    [activeIndex]
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      {/* Floating "Shorts" header */}
      <View className="absolute top-12 left-5 z-20">
        <Text className="text-white text-2xl font-extrabold tracking-wide">
          Shorts
        </Text>
      </View>

      <FlatList
        data={REELS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, index) => ({
          length: REEL_HEIGHT,
          offset: REEL_HEIGHT * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}