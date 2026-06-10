import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.BANNER : (Platform.OS === 'ios' ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy' : 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz');

export default function AdMobBanner() {
  return (
    <View className="items-center justify-center w-full">
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}
