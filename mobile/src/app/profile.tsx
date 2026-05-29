import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/screen-shell';

const rows = [
  { label: 'Edit Profile', icon: 'create-outline' as const },
  { label: 'Notifications', icon: 'notifications-outline' as const },
  { label: 'Help', icon: 'help-circle-outline' as const },
  { label: 'Logout', icon: 'log-out-outline' as const },
];

export default function ProfileScreen() {
  return (
    <ScreenShell>
      <Text className="text-[34px] font-extrabold leading-[36px] tracking-tight text-slate-900">
        Profile
      </Text>
      <Text className="mt-2 text-sm text-slate-500">Account & preferences</Text>

      <View className="mt-6 flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="h-14 w-14 rounded-2xl bg-brand-50" />
        <View>
          <Text className="text-lg font-extrabold text-slate-900">Aspirant</Text>
          <Text className="text-sm text-slate-500">SSC / Banking</Text>
        </View>
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map((r, idx) => (
          <View
            key={r.label}
            className={['flex-row items-center justify-between px-5 py-4', idx > 0 ? 'border-t border-slate-100' : ''].join(' ')}>
            <View className="flex-row items-center gap-3">
              <Ionicons name={r.icon} size={20} color="#334155" />
              <Text className="font-semibold text-slate-800">{r.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

