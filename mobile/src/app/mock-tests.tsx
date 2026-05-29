import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/screen-shell';

const list = [
  {
    title: 'Full Mock Test 2',
    subtitle: 'Advanced level - All subjects',
    meta: '20 min  •  10 questions',
  },
  {
    title: 'Quant Special Mock',
    subtitle: 'Quantitative aptitude focus',
    meta: '10 min  •  7 questions',
  },
];

export default function MockTestsScreen() {
  return (
    <ScreenShell>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-[34px] font-extrabold leading-[36px] tracking-tight text-slate-900">
            Mock Tests
          </Text>
          <Text className="mt-2 text-sm text-slate-500">Full-length timed examinations</Text>
        </View>
        <View className="h-12 w-12 rounded-2xl bg-slate-200" />
      </View>

      <View className="mt-6 rounded-3xl bg-brand-600 p-5 shadow">
        <View className="self-start rounded-lg bg-white/15 px-3 py-1">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-white" />
            <Text className="text-xs font-extrabold text-white">LIVE</Text>
          </View>
        </View>

        <Text className="mt-5 text-2xl font-extrabold text-white">Full Mock Test 1</Text>
        <Text className="mt-1 text-sm text-white/85">All subjects mixed - General level</Text>

        <View className="mt-4 flex-row items-center gap-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text className="text-xs font-semibold text-white/90">15 min</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="help-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text className="text-xs font-semibold text-white/90">10 Qs</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text className="text-xs font-semibold text-white/90">10 marks</Text>
          </View>
        </View>

        <TouchableOpacity className="mt-5 items-center rounded-2xl bg-white py-3">
          <Text className="text-sm font-extrabold text-brand-700">
            Start Test <Text className="ml-2">→</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="mt-7 text-lg font-extrabold text-slate-900">All Tests</Text>
      <View className="mt-4 gap-3">
        {list.map((t) => (
          <View key={t.title} className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <Text className="text-lg">🏆</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                {t.title}
              </Text>
              <Text className="text-sm text-slate-500" numberOfLines={1}>
                {t.subtitle}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-slate-400">{t.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

