import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, Dimensions, ActivityIndicator } from 'react-native';
import { getAllBanners } from '../services/bannerApi';

const { width } = Dimensions.get('window');

export default function AdBannerSlider() {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Fetch banners on mount
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const data = await getAllBanners();
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length]);

  // Scroll to current index
  useEffect(() => {
    if (scrollViewRef.current && banners.length > 0) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * width,
        animated: true,
      });
    }
  }, [currentIndex, banners.length]);

  const handleScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex, banners.length]);

  const handleDotPress = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  if (loading) {
    return (
      <View className="rounded-2xl overflow-hidden h-48 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View className="rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-amber-400 to-orange-500 justify-center items-center">
        <Text className="text-white text-lg font-bold">No Banners Available</Text>
      </View>
    );
  }

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
            key={banner._id}
            style={{ width }}
            className="px-5"
          >
            <View
              style={{ backgroundColor: banner.color }}
              className="rounded-2xl overflow-hidden h-48 justify-center items-center shadow-lg"
            >
              <Image
                source={{ uri: banner.imageUrl }}
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
      {banners.length > 1 && (
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
      )}
    </View>
  );
}
