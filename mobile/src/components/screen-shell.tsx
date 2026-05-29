import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';

export function ScreenShell({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: insets.bottom + BottomTabInset + 24,
      }}>
      <View className="px-5">{children}</View>
    </ScrollView>
  );
}

