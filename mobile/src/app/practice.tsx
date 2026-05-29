import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/screen-shell';

const tabs = ['All', 'Quantitative', 'Reasoning', 'English'];

const sets = [
  { title: 'Quant Basics - Set 1', subject: 'Quantitative Aptitude', qs: 3, level: 'EASY' as const },
  { title: 'Quant Intermediate', subject: 'Quantitative Aptitude', qs: 3, level: 'MEDIUM' as const },
  { title: 'Quant Advanced', subject: 'Quantitative Aptitude', qs: 3, level: 'HARD' as const },
  { title: 'Reasoning - Series', subject: 'Reasoning', qs: 3, level: 'EASY' as const },
];

const levelColor = {
  EASY: 'text-emerald-600',
  MEDIUM: 'text-amber-600',
  HARD: 'text-rose-600',
} as const;

export default function PracticeScreen() {
  return (
    <ScreenShell>
      <Text className="text-[34px] font-extrabold leading-[36px] tracking-tight text-slate-900">
        Practice Sets
      </Text>
      <Text className="mt-2 text-sm text-slate-500">Sharpen subject-wise concepts</Text>

      <View className="mt-5 flex-row gap-2">
        {tabs.map((t, idx) => (
          <TouchableOpacity
            key={t}
            className={[
              'rounded-full px-4 py-2',
              idx === 0 ? 'bg-brand-600' : 'border border-slate-200 bg-white',
            ].join(' ')}>
            <Text className={['text-xs font-extrabold', idx === 0 ? 'text-white' : 'text-slate-700'].join(' ')}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mt-5 gap-3">
        {sets.map((s) => (
          <View key={s.title} className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
              <Ionicons name="calculator" size={20} color="#1b3fd0" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                {s.title}
              </Text>
              <View className="mt-0.5 flex-row items-center gap-2">
                <Text className="text-xs font-semibold text-slate-500" numberOfLines={1}>
                  {s.subject}
                </Text>
                <Text className="text-xs font-semibold text-slate-300">•</Text>
                <Text className="text-xs font-semibold text-slate-500">{s.qs} Qs</Text>
              </View>
              <Text className={['mt-1 text-xs font-extrabold', levelColor[s.level]].join(' ')}>
                {s.level}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

