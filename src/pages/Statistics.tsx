import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Rocket, Trophy, Calendar, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

function fmtDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatCard({
  icon: Icon, value, label, color,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: 'rgba(18,18,18,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 42, height: 42, background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white leading-tight tabular-nums">{value}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</div>
      </div>
    </motion.div>
  );
}

export function Statistics() {
  const { accounts, launchHistory } = useApp();
  const { hideUsernames } = useTheme();

  const completedRecords = useMemo(
    () => launchHistory.filter(r => r.endedAt),
    [launchHistory],
  );

  const totalPlaytimeMs = useMemo(
    () => completedRecords.reduce((acc, r) =>
      acc + (new Date(r.endedAt!).getTime() - new Date(r.inGameAt ?? r.startedAt).getTime()), 0),
    [completedRecords],
  );

  const avgSessionMs = completedRecords.length > 0
    ? Math.round(totalPlaytimeMs / completedRecords.length)
    : 0;

  const lastLaunch = useMemo(
    () => launchHistory.length > 0 ? launchHistory[launchHistory.length - 1] : null,
    [launchHistory],
  );

  // Most-used: group by accountId, sort by count desc, take top 5
  const topAccounts = useMemo(() => {
    const map: Record<number, { count: number; username: string; avatarColor: string; avatarUrl?: string }> = {};
    for (const r of launchHistory) {
      if (!map[r.accountId]) {
        map[r.accountId] = { count: 0, username: r.accountUsername, avatarColor: r.avatarColor, avatarUrl: r.avatarUrl };
      }
      map[r.accountId].count++;
    }
    return Object.entries(map)
      .map(([id, v]) => ({ accountId: Number(id), ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [launchHistory]);

  const maxCount = topAccounts[0]?.count ?? 1;

  // 10 most recent sessions
  const recentSessions = useMemo(
    () => [...launchHistory].reverse().slice(0, 10),
    [launchHistory],
  );

  const cardStyle = {
    background: 'rgba(18,18,18,0.90)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
  } as const;

  const headerBorder = { borderBottom: '1px solid rgba(255,255,255,0.06)' } as const;

  return (
    <div className="p-6 space-y-5" style={{ maxWidth: 860 }}>
      <div>
        <h1 className="text-xl font-bold text-white">Statistics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Playtime, usage trends, and account activity
        </p>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          value={String(accounts.length)}
          label="Total Accounts"
          color='var(--accent)'
        />
        <StatCard
          icon={Rocket}
          value={String(launchHistory.length)}
          label="Total Sessions"
          color="#0EA5E9"
        />
        <StatCard
          icon={Clock}
          value={totalPlaytimeMs > 0 ? fmtDuration(totalPlaytimeMs) : '—'}
          label="Total Playtime"
          color="#A855F7"
        />
        <StatCard
          icon={Calendar}
          value={lastLaunch ? relTime(lastLaunch.startedAt) : '—'}
          label="Last Launched"
          color="#F59E0B"
        />
      </div>

      {/* ── Most used (collapsible) ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
      <CollapsibleSection
        title="Most Used Accounts"
        defaultOpen
        icon={
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 34, height: 34, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Trophy size={16} style={{ color: '#F59E0B' }} />
          </div>
        }
        right={topAccounts.length > 0 ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>top {topAccounts.length}</span>
        ) : undefined}
      >
        {topAccounts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Activity size={24} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No sessions recorded yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {topAccounts.map((entry, i) => (
              <div key={entry.accountId} className="flex items-center gap-4 px-5 py-3">
                {/* Rank */}
                <span
                  className="text-xs font-bold w-5 text-right flex-shrink-0 tabular-nums"
                  style={{ color: i === 0 ? '#F59E0B' : i === 1 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)' }}
                >
                  #{i + 1}
                </span>
                {/* Avatar */}
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0 text-xs font-bold"
                  style={{
                    width: 32, height: 32,
                    background: `${entry.avatarColor}20`,
                    color: entry.avatarColor,
                    border: `1px solid ${entry.avatarColor}40`,
                  }}
                >
                  {hideUsernames ? '••' : entry.username.slice(0, 2).toUpperCase()}
                </div>
                {/* Username + bar */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="text-sm font-medium text-white truncate">
                    {hideUsernames ? '••••••••' : entry.username}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.55, delay: i * 0.07, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: i === 0 ? '#F59E0B' : 'rgba(var(--accent-rgb),0.65)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
                {/* Count */}
                <span
                  className="text-sm font-bold flex-shrink-0 tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {entry.count} {entry.count === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
      </motion.div>

      {/* ── Recent sessions (collapsible) ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <CollapsibleSection
        title="Recent Sessions"
        defaultOpen
        icon={
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 34, height: 34, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}
          >
            <Clock size={16} style={{ color: '#0EA5E9' }} />
          </div>
        }
        right={recentSessions.length > 0 ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>last {recentSessions.length}</span>
        ) : undefined}
      >
        {recentSessions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock size={24} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No sessions yet — launch a game to get started
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {recentSessions.map((record, i) => {
              const startMs = new Date(record.inGameAt ?? record.startedAt).getTime();
              const durationMs = record.endedAt
                ? new Date(record.endedAt).getTime() - startMs
                : Date.now() - startMs;
              const isActive = !record.endedAt;
              return (
                <div key={record.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Avatar */}
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0 text-xs font-bold"
                    style={{
                      width: 32, height: 32,
                      background: `${record.avatarColor}20`,
                      color: record.avatarColor,
                      border: `1px solid ${record.avatarColor}40`,
                    }}
                  >
                    {hideUsernames ? '••' : record.accountUsername.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {hideUsernames ? '••••••••' : record.accountUsername}
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      Place {record.placeId} · {relTime(record.startedAt)}
                    </div>
                  </div>
                  {/* Duration / status */}
                  <div className="flex-shrink-0 text-right">
                    {isActive ? (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                      >
                        Active
                      </span>
                    ) : (
                      <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {fmtDuration(durationMs)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
      </motion.div>
    </div>
  );
}
