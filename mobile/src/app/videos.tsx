import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/screen-shell';

function VideoThumb({ title, duration }: { title: string; duration: string }) {
  return (
    <View className="relative overflow-hidden rounded-2xl bg-slate-200">
      <View className="aspect-[16/9] w-full" />
      <View className="absolute inset-0 items-center justify-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-600">
          <Ionicons name="play" size={26} color="white" />
        </View>
      </View>
      <Text className="absolute bottom-2 left-2 text-sm font-extrabold text-white">{title}</Text>
      <View className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1">
        <Text className="text-xs font-bold text-white">{duration}</Text>
      </View>
    </View>
  );
}

const sections = [
  {
    title: 'Quantitative Aptitude',
    count: '2 videos',
    items: [
      { title: 'Percentage Made Easy', duration: '12:45' },
      { title: 'Time & Work', duration: '09:10' },
    ],
  },
  {
    title: 'Reasoning',
    count: '2 videos',
    items: [
      { title: 'Coding-Decoding', duration: '10:20' },
      { title: 'Series Basics', duration: '08:05' },
    ],
  },
];

export default function VideosScreen() {
  return (
    <ScreenShell>
      <Text className="text-[34px] font-extrabold leading-[36px] tracking-tight text-slate-900">
        Video Classes
      </Text>
      <Text className="mt-2 text-sm text-slate-500">Learn from short, focused lessons</Text>

      <View className="mt-6">
        <VideoThumb title="Percentage Made Easy" duration="12:45" />
      </View>

      <View className="mt-7 gap-6">
        {sections.map((s) => (
          <View key={s.title}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-slate-900">{s.title}</Text>
              <Text className="text-sm font-semibold text-slate-400">{s.count}</Text>
            </View>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <VideoThumb title={s.items[0].title} duration={s.items[0].duration} />
              </View>
              <View className="flex-1">
                <VideoThumb title={s.items[1].title} duration={s.items[1].duration} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

