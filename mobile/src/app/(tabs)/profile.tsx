import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getCurrentUser } from '../../services/authApi';
import { setUser } from '../../store/slices/authSlice';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name?: string): string => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatBadge = ({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string | number;
  label: string;
}) => (
  <View style={styles.statBadge}>
    <View style={styles.statIconRow}>
      <Feather name={icon} size={13} color="#fcd34d" />
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatDivider = () => <View style={styles.statDivider} />;

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
    <View style={styles.menuIcon}>
      <Feather name={icon} size={19} color="#2563EB" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <Feather name="chevron-right" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();
  const { logout } = useAuth();

  const user  = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [imgError,      setImgError]      = useState(false);

  // ── Refresh user data from server ─────────────────────────────────────────
  const refreshUser = async (showIndicator = false) => {
    if (!token) return;
    if (showIndicator) setRefreshing(true);
    try {
      const res = await getCurrentUser(token);
      if (res.success && res.user) {
        dispatch(setUser(res.user));
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Profile refresh failed:', err);
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  };

  // Refresh on mount to get latest profileImage / name from server
  useEffect(() => {
    refreshUser();
  }, [token]);

  // Reset imgError when user changes (new login)
  useEffect(() => {
    setImgError(false);
  }, [user?.profileImage]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              await logout();
              router.replace('/login');
            } catch {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // ── Menu config ───────────────────────────────────────────────────────────
  const menuItems = [
    {
      icon: 'bookmark'    as const,
      title: 'Saved Questions',
      subtitle: 'Review bookmarked questions',
      route: '/saved-questions',
    },
    {
      icon: 'pie-chart'   as const,
      title: 'My Performance',
      subtitle: `${user?.testsTaken ?? 0} tests · ${user?.accuracy ?? 0}% accuracy`,
      route: '/my-performance',
    },
    {
      icon: 'settings'    as const,
      title: 'Settings',
      subtitle: 'Language, notifications & more',
      route: '/settings',
    },
    {
      icon: 'help-circle' as const,
      title: 'Help & Support',
      subtitle: 'FAQs, email & chat support',
      route: '/help-support',
    },
  ];

  // ── Avatar ────────────────────────────────────────────────────────────────
  const showImage = !!user?.profileImage && !imgError;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refreshUser(true)}
          tintColor="#2563EB"
          colors={['#2563EB']}
        />
      }
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        {/* Avatar */}
        {showImage ? (
          <Image
            source={{ uri: user.profileImage }}
            style={styles.avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
          </View>
        )}

        {/* Name */}
        <Text style={styles.name}>{user?.name || 'Guest User'}</Text>

        {/* Email */}
        <Text style={styles.email}>
          {user?.email || 'Sign in to access all features'}
        </Text>

        {/* Phone */}
        {!!user?.phone && (
          <Text style={styles.phone}>📞 {user.phone}</Text>
        )}

        {/* Stats row — only for logged-in users */}
        {!!user && (
          <View style={styles.statsRow}>
            <StatBadge
              icon="clipboard"
              value={user.testsTaken ?? 0}
              label="Tests"
            />
            <StatDivider />
            <StatBadge
              icon="target"
              value={`${user.accuracy ?? 0}%`}
              label="Accuracy"
            />
            <StatDivider />
            <StatBadge
              icon="zap"
              value={user.streak ?? 0}
              label="Streak 🔥"
            />
          </View>
        )}
      </View>

      {/* ── Menu ──────────────────────────────────────────────────────────── */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.title}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            onPress={() => router.push(item.route as any)}
          />
        ))}

        {/* ── Auth button ── */}
        {user ? (
          <TouchableOpacity
            onPress={handleLogout}
            disabled={logoutLoading}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            {logoutLoading ? (
              <>
                <ActivityIndicator color="#DC2626" size="small" />
                <Text style={styles.logoutText}>Logging out…</Text>
              </>
            ) : (
              <>
                <View style={styles.logoutIcon}>
                  <Feather name="log-out" size={19} color="#DC2626" />
                </View>
                <Text style={[styles.logoutText, { flex: 1 }]}>Logout</Text>
                <Feather name="chevron-right" size={18} color="#fca5a5" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.loginBtn}
            activeOpacity={0.7}
          >
            <View style={styles.loginIcon}>
              <Feather name="log-in" size={19} color="#D97706" />
            </View>
            <Text style={[styles.loginText, { flex: 1 }]}>Login / Sign Up</Text>
            <Feather name="chevron-right" size={18} color="#fcd34d" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  email: {
    color: '#bfdbfe',
    fontSize: 13,
    marginTop: 3,
  },
  phone: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 4,
  },
  statLabel: {
    color: '#bfdbfe',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
  },

  // Menu
  menuSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Login
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  loginIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
});


// here it is internal css 
// later will comvert to tailwind