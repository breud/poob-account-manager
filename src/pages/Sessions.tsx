import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Clock, Wifi, Gamepad2, RotateCcw, Timer, XCircle, Power } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePresence, formatRuntime } from '../hooks/usePresence';
import { CollapsibleSection } from '../components/ui/CollapsibleSection';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'Just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatDuration(startIso: string, endIso?: string): string {
  const ms = (endIso ? new Date(endIso).getTime() : Date.now()) - new Date(startIso).getTime();
  if (ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function LiveDuration({ startMs }: { startMs: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;
  return <>{formatRuntime(startMs)}</>;
}

export function Sessions() {
  const { accounts, launchHistory, openLaunch, endLaunchSession, showConfirm } = useApp();
  const { hideUsernames, hideNotes } = useTheme();
  const { toast } = useToast();
  const [killingAll, setKillingAll] = useState(false);
  const mask = (s: string) => hideUsernames ? '••••••••' : s;
  const presenceMap = usePresence(accounts);

  // End sessions when an account leaves a game
  const prevPresence = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const account of accounts) {
      if (!account.robloxUserId) continue;
      const uid     = account.robloxUserId;
      const current = presenceMap[uid]?.presenceType ?? -1;
      const prev    = prevPresence.current[uid] ?? -1;
      if (prev === 2 && current !== 2) endLaunchSession(account.id);
      prevPresence.current[uid] = current;
    }
  }, [presenceMap, accounts, endLaunchSession]);

  const inGameAccounts = useMemo(() =>
    accounts.filter(a => {
      const p = a.robloxUserId ? presenceMap[a.robloxUserId] : undefined;
      return p?.presenceType === 2;
    }),
    [accounts, presenceMap],
  );

  const history = useMemo(() => [...launchHistory].reverse(), [launchHistory]);

  const todayLaunches = useMemo(() => {
    const n = new Date();
    return launchHistory.filter(r => {
      const d = new Date(r.startedAt);
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    }).length;
  }, [launchHistory]);

  const avgDurationMs = useMemo(() => {
    const ended = launchHistory.filter(r => r.endedAt);
    if (ended.length === 0) return null;
    const total = ended.reduce((sum, r) =>
      sum + (new Date(r.endedAt!).getTime() - new Date(r.inGameAt ?? r.startedAt).getTime()), 0);
    return total / ended.length;
  }, [launchHistory]);

  const handleKillAll = () => {
    showConfirm({
      title: 'Kill All Roblox Sessions',
      message: `Force-close all ${inGameAccounts.length} running Roblox instance${inGameAccounts.length !== 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: 'Kill All',
      danger: true,
      onConfirm: async () => {
        setKillingAll(true);
        await window.electronAPI?.killAllRoblox?.();
        for (const acct of inGameAccounts) endLaunchSession(acct.id);
        setKillingAll(false);
        toast(`Killed ${inGameAccounts.length} Roblox instance${inGameAccounts.length !== 1 ? 's' : ''}`, 'success');
      },
    });
  };

  const fmtAvg = (ms: number | null) => {
    if (ms === null) return '—';
    const m = Math.floor(ms / 60_000);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Active Sessions',  value: inGameAccounts.length,  color: 'var(--accent)', Icon: Wifi    },
          { label: "Today's Launches", value: todayLaunches,           color: '#0EA5E9', Icon: Monitor },
          { label: 'Avg Duration',     value: fmtAvg(avgDurationMs),  color: '#A855F7', Icon: Clock   },
        ] as const).map(({ label, value, color, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, background: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Currently in-game */}
      {inGameAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(34,197,94,0.15)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.7)', animation: 'pulse 2s infinite' }}
            />
            <h3 className="text-sm font-semibold" style={{ color: '#22C55E' }}>Currently In Game</h3>
            <button
              onClick={handleKillAll}
              disabled={killingAll}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: killingAll ? 'rgba(239,68,68,0.35)' : '#EF4444',
                cursor: killingAll ? 'not-allowed' : 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!killingAll) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <XCircle size={12} strokeWidth={2} />
              Kill All
            </button>
          </div>
          {inGameAccounts.map((account, i) => {
            const pres = account.robloxUserId ? presenceMap[account.robloxUserId] : undefined;
            return (
              <div
                key={account.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < inGameAccounts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt={account.username} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40`, flexShrink: 0 }} />
                ) : (
                  <div className="flex items-center justify-center rounded-xl text-xs font-bold flex-shrink-0" style={{ width: 36, height: 36, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}>
                    {hideUsernames ? '••' : account.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{mask(account.username)}</div>
                  {pres?.gameName && (
                    <div className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: '#22C55E' }}>
                      <Gamepad2 size={10} strokeWidth={2} /> {hideNotes ? '••••••' : pres.gameName}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-semibold flex items-center gap-1" style={{ color: '#22C55E' }}>
                    <Timer size={11} strokeWidth={2} />
                    {pres?.sessionStart != null ? <LiveDuration startMs={pres.sessionStart} /> : '—'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>runtime</div>
                </div>
                <button
                  onClick={async () => {
                    // Target this account's own process when known; fall back to all.
                    const pid = await window.electronAPI?.getAccountPid?.(account.id);
                    if (pid) await window.electronAPI?.killRobloxPid?.(pid);
                    else await window.electronAPI?.killAllRoblox?.();
                    endLaunchSession(account.id);
                    toast(`Killed Roblox for ${hideUsernames ? 'account' : account.username}`, 'success');
                  }}
                  title="Kill Roblox session"
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: 30, height: 30,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#EF4444',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)')}
                >
                  <Power size={12} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Launch history (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <CollapsibleSection
        title="Launch History"
        subtitle={history.length > 0 ? `${history.length} total launch${history.length !== 1 ? 'es' : ''}` : 'No launches recorded yet'}
        defaultOpen
      >
        {history.length === 0 ? (
          <div className="py-16 text-center">
            <Monitor size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No launches yet</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Sessions will appear here once you launch an account</p>
          </div>
        ) : (
          <AnimatePresence>
            {history.map((record, i) => {
              const account  = accounts.find(a => a.id === record.accountId);
              const isActive = !record.endedAt;
              return (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 group"
                  style={{
                    borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {record.avatarUrl ? (
                    <img src={record.avatarUrl} alt={record.accountUsername} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: `1.5px solid ${record.avatarColor}40`, flexShrink: 0 }} />
                  ) : (
                    <div className="flex items-center justify-center rounded-xl text-xs font-bold flex-shrink-0" style={{ width: 36, height: 36, background: `${record.avatarColor}20`, border: `1.5px solid ${record.avatarColor}40`, color: record.avatarColor }}>
                      {hideUsernames ? '••' : record.accountUsername.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{mask(record.accountUsername)}</div>
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <Gamepad2 size={10} strokeWidth={2} />
                      Place {record.placeId} · {relativeTime(record.startedAt)}
                    </div>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div className="font-mono text-sm font-semibold" style={{ color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }}>
                      {isActive
                        ? <LiveDuration startMs={new Date(record.inGameAt ?? record.startedAt).getTime()} />
                        : formatDuration(record.inGameAt ?? record.startedAt, record.endedAt)
                      }
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>duration</div>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{
                      background: isActive ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(100,116,139,0.12)',
                      color:      isActive ? 'var(--accent)'             : '#94A3B8',
                    }}
                  >
                    {isActive ? 'Active' : 'Ended'}
                  </span>

                  {account && !isActive && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openLaunch(account.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)', cursor: 'pointer', border: 'none' }}
                      title="Relaunch"
                    >
                      <RotateCcw size={12} strokeWidth={2} />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CollapsibleSection>
      </motion.div>
    </div>
  );
}
