import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';

const BannerCarousel = ({ banners = [] }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = Dimensions.get('window');

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleBannerPress = (banner) => {
    if (banner.actionType === 'series' && banner.actionValue) {
      router.push({
        pathname: '/test-series-detail',
        params: { id: banner.actionValue },
      });
    } else if (banner.actionType === 'url' && banner.actionValue) {
      Linking.openURL(banner.actionValue).catch(() => {});
    }
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={{ width, height: 200, backgroundColor: '#fff', marginBottom: 12 }}>
      <FlatList
        data={banners}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleBannerPress(item)}
            activeOpacity={0.85}
            style={{ width, height: 200 }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item._id}
      />

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
          }}
        >
          {banners.map((_, index) => (
            <View
              key={index}
              style={{
                width: activeIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  activeIndex === index
                    ? '#8B5CF6'
                    : 'rgba(255, 255, 255, 0.5)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default BannerCarousel;
