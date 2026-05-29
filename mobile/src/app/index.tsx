import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';

function StatCard({
  emoji,
  bg,
  value,
  label,
}: {
  emoji: string;
  bg: string;
  value: string;
  label: string;
}) {
  return (
    <View className="w-[48%] rounded-2xl border border-slate-200 bg-white p-4">
      <View className={['h-11 w-11 items-center justify-center rounded-xl', bg].join(' ')}>
        <Text className="text-lg">{emoji}</Text>
      </View>
      <Text className="mt-4 text-3xl font-extrabold text-slate-900">{value}</Text>
      <Text className="text-xs font-semibold tracking-wide text-slate-500">{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenShell>
      <View className="items-center">
        <View className="h-[92px] w-[92px] rounded-full bg-white p-1">
          <View className="h-full w-full rounded-full bg-brand-600 p-1">
            <View className="h-full w-full rounded-full bg-slate-100" />
          </View>
        </View>
        <Text className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Aspirant</Text>
        <Text className="mt-1 text-sm text-slate-500">Target Exam: SSC / Banking</Text>
      </View>

      <View className="mt-6 flex-row flex-wrap gap-4">
        <StatCard emoji="🏆" bg="bg-amber-50" value="1" label="TESTS" />
        <StatCard emoji="📄" bg="bg-indigo-50" value="0" label="PRACTICE" />
        <StatCard emoji="✅" bg="bg-emerald-50" value="40%" label="ACCURACY" />
        <StatCard emoji="📈" bg="bg-rose-50" value="40%" label="AVG SCORE" />
      </View>

      <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <Text className="text-lg font-extrabold text-slate-900">Performance Summary</Text>
        <View className="mt-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">Total Questions Solved</Text>
            <Text className="text-sm font-bold text-slate-900">10</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">Time Spent</Text>
            <Text className="text-sm font-bold text-slate-900">1h 25m</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">Best Subject</Text>
            <Text className="text-sm font-bold text-slate-900">Quant</Text>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}
