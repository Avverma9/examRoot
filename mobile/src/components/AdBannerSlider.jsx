import React, { useRef, useEffect, useState, useCallback } from 'react-native';
import { View, ScrollView, TouchableOpacity, Image, Text, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const banners = [
  {
    id: 1,
    title: 'Summer Sale',
    subtitle: 'Get 50% Off All Courses',
    color: '#FF6B6B',
    image: 'https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=50%+OFF',
  },
  {
    id: 2,
    title: 'Free Trial',
    subtitle: 'Start Your Journey Today',
    color: '#4ECDC4',
    image: 'https://via.placeholder.com/400x200/4ECDC4/FFFFFF?text=FREE+TRIAL',
  },
  {
    id: 3,
    title: 'Expert Teachers',
    subtitle: 'Learn From The Best',
    color: '#FFD93D',
    image: 'https://via.placeholder.com/400x200/FFD93D/FFFFFF?text=BEST+TEACHERS',
  },
];

export default function AdBannerSlider() {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * width,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [currentIndex]);

  const handleDotPress = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  return (
    <View className="mb-6">
      {/* Banner Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        className="rounded-2xl overflow-hidden"
      >
        {banners.map((banner) => (
          <View
            key={banner.id}
            style={{ width }}
            className="px-5"
          >
            <View
              style={{ backgroundColor: banner.color }}
              className="rounded-2xl overflow-hidden h-48 justify-center items-center shadow-lg"
            >
              <Image
                source={{ uri: banner.image }}
                style={{ width: '100%', height: '100%', position: 'absolute' }}
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20" />
              <View className="items-center justify-center px-4">
                <Text className="text-white text-3xl font-extrabold mb-2 text-center">
                  {banner.title}
                </Text>
                <Text className="text-white text-base font-semibold text-center">
                  {banner.subtitle}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View className="flex-row justify-center items-center mt-4 gap-2">
        {banners.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleDotPress(index)}
            style={{
              width: index === currentIndex ? 10 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex ? '#F59E0B' : '#D1D5DB',
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>
    </View>
  );
}
