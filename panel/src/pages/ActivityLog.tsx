import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  MonitorCheck,
  Plus,
  SignalHigh,
  Smartphone,
  Users,
  Video,
  Wifi,
  LucideIcon,
} from 'lucide-react';
import {
  useGetActivityLogOverviewQuery,
  useGetCurrentActivityLogQuery,
  useGetActivityLogSessionsQuery,
} from '../services/adminStatsApi';

const moneyFormat = new Intl.NumberFormat('en-IN');

const formatMinutes = (seconds?: number) => {
  const mins = Math.max(0, Math.round((seconds || 0) / 60));
  return mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatTimeOnly = (value?: string | Date | null) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDayAndDate = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
};

const dateKey = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const monthKeyFromDate = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
const parseDateKey = (value: string) => new Date(`${value}T00:00:00`);

const buildMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const getCalendarDays = (year: number, monthIndex: number) => {
  const firstDay = new Date(year, monthIndex, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
};

const unwrapActivityPayload = (payload: any) => payload?.data ?? payload ?? {};

function MetricCard({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  meta?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</div>
        <div className="rounded-full border border-zinc-700 bg-zinc-950/60 p-2">
          <Icon className="h-4 w-4 text-orange-400" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-black tracking-tight text-zinc-50">{value}</div>
      {meta ? <div className="mt-2 text-xs font-medium text-zinc-500">{meta}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-50">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ActivityLog() {
  const { data: overviewRes, isLoading: overviewLoading, error: overviewError } =
    useGetActivityLogOverviewQuery({ days: 30 });
  const { data: currentRes, isLoading: currentLoading } = useGetCurrentActivityLogQuery();
  const { data: sessionsRes, isLoading: sessionsLoading } =
    useGetActivityLogSessionsQuery({ days: 30, page: 1, limit: 60 });

  const overviewData = unwrapActivityPayload(overviewRes);
  const currentData = unwrapActivityPayload(currentRes);
  const sessionsData = unwrapActivityPayload(sessionsRes);

  const summary = overviewData?.summary || currentData?.summary || {};
  const currentSessions = overviewData?.currentSessions || currentData?.data || currentData || [];
  const daily = overviewData?.daily || [];
  const sessions = Array.isArray(sessionsData?.data) ? sessionsData.data : Array.isArray(sessionsData) ? sessionsData : [];
  const loading = overviewLoading || currentLoading || sessionsLoading;
  const todayKey = dateKey(new Date());
  const todayMonthKey = monthKeyFromDate(new Date());

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(todayMonthKey);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayKey);

  const dailyByDate = useMemo(
    () =>
      daily.reduce((acc: Record<string, any>, item: any) => {
        acc[item.date] = item;
        return acc;
      }, {}),
    [daily]
  );

  const monthKeys = useMemo(() => {
    const keys = Array.from(
      new Set(
        daily
          .map((item: any) => item?.date)
          .filter(Boolean)
          .map((value: string) => monthKeyFromDate(parseDateKey(value)))
      )
    );
    if (keys.length === 0) keys.push(monthKeyFromDate(new Date()));
    return keys.sort();
  }, [daily]);

  useEffect(() => {
    if (!selectedMonthKey || !monthKeys.includes(selectedMonthKey)) {
      setSelectedMonthKey(monthKeys.includes(todayMonthKey) ? todayMonthKey : monthKeys[monthKeys.length - 1]);
    }
  }, [monthKeys, selectedMonthKey, todayMonthKey]);

  useEffect(() => {
    if (!selectedDateKey || selectedDateKey !== todayKey) {
      setSelectedDateKey(todayKey);
    }
  }, [selectedDateKey, todayKey]);

  const selectedMonthIndex = selectedMonthKey ? monthKeys.indexOf(selectedMonthKey) : -1;
  const canGoPrev = selectedMonthIndex > 0;
  const canGoNext = selectedMonthIndex >= 0 && selectedMonthIndex < monthKeys.length - 1;

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return { year: new Date().getFullYear(), monthIndex: new Date().getMonth() };
    const [year, month] = selectedMonthKey.split('-').map(Number);
    return { year, monthIndex: month - 1 };
  }, [selectedMonthKey]);

  const calendarDays = useMemo(
    () => getCalendarDays(selectedMonthData.year, selectedMonthData.monthIndex),
    [selectedMonthData]
  );

  const selectedDayStats = useMemo(() => {
    if (!selectedDateKey) return null;
    const stats = dailyByDate[selectedDateKey];
    if (stats) return stats;
    const daySessions = sessions.filter((session: any) => {
      const started = session.firstSeenAt ? dateKey(new Date(session.firstSeenAt)) : null;
      return started === selectedDateKey;
    });
    if (!daySessions.length) return null;
    const activeSeconds = daySessions.reduce((sum: number, session: any) => sum + Math.max(0, Number(session.durationSeconds || 0)), 0);
    return {
      date: selectedDateKey,
      sessions: daySessions.length,
      uniqueDevices: new Set(daySessions.map((session: any) => session.deviceId).filter(Boolean)).size,
      uniqueUsers: new Set(daySessions.map((session: any) => String(session.userId?._id || session.userId || '')).filter(Boolean)).size,
      activeMinutes: Math.round((activeSeconds / 60) * 10) / 10,
    };
  }, [dailyByDate, selectedDateKey, sessions]);
  const selectedSessions = useMemo(() => {
    if (!selectedDateKey) return [];
    return sessions.filter((session: any) => {
      const started = session.firstSeenAt ? dateKey(new Date(session.firstSeenAt)) : null;
      return started === selectedDateKey;
    });
  }, [sessions, selectedDateKey]);

  const maxDailySessions = Math.max(...daily.map((item: any) => item.sessions || 0), 1);
  const selectedActiveMinutes = useMemo(() => {
    if (selectedDayStats?.activeMinutes != null) return selectedDayStats.activeMinutes;
    if (!selectedSessions.length) return 0;
    const seconds = selectedSessions.reduce((sum: number, session: any) => sum + Math.max(0, Number(session.durationSeconds || 0)), 0);
    return Math.round((seconds / 60) * 10) / 10;
  }, [selectedDayStats, selectedSessions]);

  if (loading) return <div className="text-zinc-400">Loading activity log...</div>;
  if (overviewError) return <div className="text-red-400">Failed to load activity log</div>;

  const metricCards = [
    {
      icon: Smartphone,
      label: 'Current Active Devices',
      value: moneyFormat.format(summary.currentActiveDevices || 0),
      meta: `Heartbeat window: ${summary.activeWindowSeconds || 120}s`,
    },
    {
      icon: Users,
      label: 'Current Active Users',
      value: moneyFormat.format(summary.currentActiveUsers || 0),
      meta: 'Foreground sessions right now',
    },
    {
      icon: SignalHigh,
      label: 'Devices Active Today',
      value: moneyFormat.format(summary.todayDevices || 0),
      meta: `${moneyFormat.format(summary.todaySessions || 0)} sessions started today`,
    },
    {
      icon: Activity,
      label: 'Active Minutes',
      value: formatMinutes((summary.totalActiveMinutes || 0) * 60),
      meta: 'From current active sessions',
    },
    {
      icon: CalendarDays,
      label: 'Sessions in Range',
      value: moneyFormat.format(summary.totalSessions || 0),
      meta: 'Last 30 days',
    },
    {
      icon: Globe,
      label: 'Unique Devices',
      value: moneyFormat.format(summary.totalDevices || 0),
      meta: 'Tracked during selected range',
    },
  ];

  const renderSessionCard = (session: any, index: number) => {
    const styles = [
      { accent: 'border-l-indigo-500', chip: 'bg-indigo-50 text-indigo-600' },
      { accent: 'border-l-amber-400', chip: 'bg-amber-50 text-amber-600' },
      { accent: 'border-l-emerald-500', chip: 'bg-emerald-50 text-emerald-600' },
    ];
    const s = styles[index % styles.length];

    return (
      <div
        key={session.sessionId}
        className={`min-w-0 flex h-full flex-col gap-2 rounded-2xl border border-slate-100 border-l-[4px] bg-white p-5 shadow-sm ${s.accent}`}
      >

        <div className="flex items-start justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">
            {session.userId?.name || 'Session Info'}
          </h3>
          <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${s.chip}`}>
            {session.endedAt ? formatTimeOnly(session.endedAt) : 'LIVE'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-slate-500">
          <Clock className="h-4 w-4 text-slate-400" />
          {formatTimeOnly(session.firstSeenAt)} - {session.endedAt ? formatTimeOnly(session.endedAt) : 'Now'}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-slate-500">
          <MapPin className="h-4 w-4 text-slate-400" />
          {session.deviceLabel || session.platform || 'System Sync'}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 text-left">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
          <Wifi className="h-3.5 w-3.5" />
          Activity Log
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-50">Mobile app activity and live sessions</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          Tracks foreground app sessions by user, device, and IP. Sessions stay active while the app is open and are expired automatically if heartbeats stop.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card, index) => (
          <div key={index}>
            <MetricCard icon={card.icon} label={card.label} value={card.value} meta={card.meta} />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          borderRadius: 32,
          background: '#FFFFFF',
          boxShadow: '0 24px 70px rgba(15, 23, 42, 0.12)',
          color: '#1E293B',
          flexDirection: 'row',
          minHeight: '82vh',
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: '0 0 58%',
            flexDirection: 'column',
            borderBottom: '1px solid #EEF2F7',
            borderRight: '1px solid #EEF2F7',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 40, paddingBottom: 28 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {selectedMonthKey ? buildMonthLabel(selectedMonthKey) : 'July 2026'}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: '#64748B' }}>
                Select a date to view events
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
              <button
                type="button"
                onClick={() => canGoPrev && setSelectedMonthKey(monthKeys[selectedMonthIndex - 1])}
                disabled={!canGoPrev}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  width: 28,
                  height: 28,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: canGoPrev ? 'pointer' : 'not-allowed',
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => canGoNext && setSelectedMonthKey(monthKeys[selectedMonthIndex + 1])}
                disabled={!canGoNext}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  width: 28,
                  height: 28,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: canGoNext ? 'pointer' : 'not-allowed',
                }}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 0,
              padding: '0 40px',
              rowGap: 14,
            }}
          >
            {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => (
              <div key={day} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em' }}>
                {day}
              </div>
            ))}
            {calendarDays.map((day) => {
              const key = dateKey(day);
              const isCurrentMonth = selectedMonthKey ? monthKeyFromDate(day) === selectedMonthKey : false;
              const isSelected = selectedDateKey === key;
              const stats = dailyByDate[key];
              const intensity = stats ? Math.min(1, (stats.sessions || 0) / maxDailySessions) : 0;
              const cellBg = stats ? `rgba(91, 66, 243, ${0.10 + intensity * 0.25})` : 'transparent';

              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      border: 'none',
                      background: isSelected ? '#5B42F3' : cellBg,
                      color: isSelected ? '#FFFFFF' : isCurrentMonth ? '#334155' : '#CBD5E1',
                      fontSize: 15,
                      fontWeight: 600,
                      boxShadow: isSelected ? '0 10px 20px rgba(91, 66, 243, 0.28)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      paddingTop: 2,
                    }}
                  >
                    <span style={{ fontSize: 15, lineHeight: 1 }}>{day.getDate()}</span>
                    <span style={{ fontSize: 8, lineHeight: 1, fontWeight: 700, opacity: isSelected ? 0.92 : 0.8 }}>
                      {stats ? `${stats.sessions || 0}S` : ''}
                    </span>
                    <span style={{ fontSize: 8, lineHeight: 1, fontWeight: 700, opacity: isSelected ? 0.92 : 0.7 }}>
                      {stats ? `${stats.uniqueDevices || 0}D` : ''}
                    </span>
                    <span style={{ fontSize: 8, lineHeight: 1, fontWeight: 700, opacity: isSelected ? 0.92 : 0.7 }}>
                      {stats ? `${stats.uniqueUsers || 0}U` : ''}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 40px 34px' }}>
            <button
              type="button"
              onClick={() => setSelectedDateKey(dateKey(new Date()))}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#5B42F3',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Go to Today
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#5B42F3', display: 'inline-block' }} />
              Selected
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: '#F9FAFC', padding: 40, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {selectedDateKey ? formatDayAndDate(selectedDateKey) : 'Select date'}
              </div>
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: '#64748B' }}>
                Selected date details
              </div>
            </div>
            <div
              style={{
                minWidth: 62,
                height: 40,
                borderRadius: 12,
                background: '#5B42F3',
                color: '#FFFFFF',
                boxShadow: '0 12px 24px rgba(91, 66, 243, 0.22)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {selectedDayStats?.sessions ?? 0}
              </div>
            </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div style={{ minWidth: 0, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sessions</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{selectedDayStats?.sessions ?? 0}</div>
            </div>
            <div style={{ minWidth: 0, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Devices</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{selectedDayStats?.uniqueDevices ?? 0}</div>
            </div>
            <div style={{ minWidth: 0, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Users</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{selectedDayStats?.uniqueUsers ?? 0}</div>
            </div>
            <div style={{ minWidth: 0, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Minutes</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#0F172A' }}>
                {selectedDateKey ? `${selectedActiveMinutes} min` : '-'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session: any, i: number) => renderSessionCard(session, i))
            ) : (
              <div style={{ gridColumn: '1 / -1', borderRadius: 18, background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No events on this date</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                  This date has no recorded sessions in the selected range.
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 22, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
            You have {selectedSessions.length} events on this date.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <SectionCard title="Current Active Devices" subtitle="Live sessions seen within the heartbeat window.">
          <div className="space-y-3">
            {currentSessions.length ? (
              currentSessions.map((session: any) => (
                <div key={session.sessionId} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <MonitorCheck className="h-4 w-4 text-emerald-400" />
                        <div className="text-sm font-bold text-zinc-50">
                          {session.userId?.name || session.userId?.email || 'Unknown user'}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {session.deviceLabel || session.platform || 'Mobile device'} · {session.ipAddress || 'IP hidden'}
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Live
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                    <div>
                      <div className="text-zinc-600">Session</div>
                      <div className="mt-1 font-medium text-zinc-200">{session.sessionId}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600">Active for</div>
                      <div className="mt-1 font-medium text-zinc-200">{formatMinutes(session.durationSeconds || 0)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600">Started</div>
                      <div className="mt-1 font-medium text-zinc-200">{formatDateTime(session.firstSeenAt)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600">Last ping</div>
                      <div className="mt-1 font-medium text-zinc-200">{formatDateTime(session.lastSeenAt)}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
                No active mobile devices right now.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
