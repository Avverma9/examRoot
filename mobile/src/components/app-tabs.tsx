import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

function TabButton({
  isFocused,
  label,
  icon,
  ...props
}: TabTriggerSlotProps & { label: string; icon: any }) {
  return (
    <Pressable {...props} className="flex-1 items-center justify-center py-2">
      <View className="items-center justify-center gap-1">
        <SymbolView
          name={icon}
          size={22}
          tintColor={isFocused ? '#2b6cff' : '#64748b'}
          style={{ marginBottom: 2 }}
        />
        <ThemedText
          type="small"
          style={{ fontWeight: '700' }}
          themeColor={isFocused ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View className="absolute bottom-0 w-full border-t border-slate-200 bg-white/95 px-2 pb-2 pt-2">
          <View className="flex-row">
            <TabTrigger name="Home" href="/" asChild>
              <TabButton
                label="Home"
                icon={{ ios: 'house.fill', android: 'home', web: 'home' }}
              />
            </TabTrigger>
            <TabTrigger name="Practice" href="/practice" asChild>
              <TabButton
                label="Practice"
                icon={{ ios: 'doc.text.fill', android: 'description', web: 'doc.text' }}
              />
            </TabTrigger>
            <TabTrigger name="Videos" href="/videos" asChild>
              <TabButton
                label="Videos"
                icon={{ ios: 'play.circle.fill', android: 'play-circle', web: 'play.circle' }}
              />
            </TabTrigger>
            <TabTrigger name="Mock" href="/mock-tests" asChild>
              <TabButton
                label="Mock Tests"
                icon={{ ios: 'trophy.fill', android: 'emoji-events', web: 'trophy' }}
              />
            </TabTrigger>
            <TabTrigger name="Profile" href="/profile" asChild>
              <TabButton
                label="Profile"
                icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
              />
            </TabTrigger>
          </View>
        </View>
      </TabList>
    </Tabs>
  );
}
