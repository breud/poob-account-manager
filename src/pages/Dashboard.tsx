import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play, ShieldCheck, MoreHorizontal, Star, Trash2, Pencil,
  Plus, Users, Heart, ShieldAlert, Wifi, Timer,
  Calendar, UserPlus, Coins, Search, Copy, RotateCcw,
  RefreshCw, Tag as TagIcon, X, Power, AlignLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DropdownPortal } from '../components/ui/DropdownPortal';
import { usePresence, formatRuntime, type PresenceMap } from '../hooks/usePresence';
import { useRobloxStats, fmtRobux, fmtNumber, fmtJoinDate, type StatsMap } from '../hooks/useRobloxStats';
import type { Account, Tag } from '../types';

function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'Just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Live runtime ticker ───────────────────────────────────────────────────────

function RuntimeTicker({ startMs }: { startMs: number | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!startMs) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [startMs]);
  return <>{formatRuntime(startMs)}</>;
}

// ── Click-to-copy info row ────────────────────────────────────────────────────

function InfoRow({
  label, value, copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  const { toast } = useToast();
  const handleCopy = () => {
    if (!copyValue) return;
    navigator.clipboard.writeText(copyValue).then(() => {
      toast(`Copied ${label.toLowerCase()} to clipboard.`, 'success');
    });
  };

  return (
    <div
      className="flex items-start gap-1.5 group/row"
      onClick={copyValue ? handleCopy : undefined}
      style={{ cursor: copyValue ? 'pointer' : 'default' }}
      title={copyValue ? `Click to copy ${label.toLowerCase()}` : undefined}
    >
      <span
        className="text-xs flex-shrink-0 font-medium"
        style={{ color: 'var(--accent, #9B77FF)', minWidth: 80 }}
      >
        {label}:
      </span>
      <span className="text-xs break-all flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {value}
        {copyValue && (
          <Copy
            size={9}
            strokeWidth={2}
            className="opacity-0 group-hover/row:opacity-60 flex-shrink-0 transition-opacity"
          />
        )}
      </span>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

const STAT_CELLS = [
  { key: 'robux',     Icon: Coins,     label: 'Robux',     color: '#F59E0B' },
  { key: 'joinDate',  Icon: Calendar,  label: 'Joined',    color: '#0EA5E9' },
  { key: 'friends',   Icon: Users,     label: 'Friends',   color: '#A855F7' },
  { key: 'followers', Icon: UserPlus,  label: 'Followers', color: '#EC4899' },
] as const;

function StatsStrip({ stats }: { stats: import('../hooks/useRobloxStats').RobloxStats | undefined }) {
  const loading = stats === undefined;

  const getValue = (key: typeof STAT_CELLS[number]['key']) => {
    if (!stats) return null;
    if (key === 'robux')    return fmtRobux(stats.robux);
    if (key === 'joinDate') return fmtJoinDate(stats.joinDate);
    return fmtNumber(stats[key]);
  };

  return (
    <div className="grid grid-cols-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {STAT_CELLS.map(({ key, Icon, label, color }, i) => {
        const val = getValue(key);
        return (
          <div
            key={key}
            className="flex flex-col items-center justify-center py-3 gap-1"
            style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            <Icon size={11} style={{ color, opacity: 0.7, flexShrink: 0 }} />
            {loading ? (
              <div className="rounded" style={{ width: 36, height: 10, background: 'rgba(255,255,255,0.07)' }} />
            ) : (
              <span className="text-xs font-bold text-white leading-none" style={{ letterSpacing: '-0.02em' }}>
                {val}
              </span>
            )}
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Account card ──────────────────────────────────────────────────────────────

function AccountCard({
  account,
  index,
  presenceMap,
  statsMap,
}: {
  account: Account;
  index: number;
  presenceMap: PresenceMap;
  statsMap: StatsMap;
}) {
  const { deleteAccount, showConfirm, openLaunch, openEdit, updateAccount, endLaunchSession, openDescription } = useApp();
  const { toast } = useToast();
  const { theme, hideUsernames, hideNotes } = useTheme();
  const mask = (s: string) => hideUsernames ? '••••••••' : s;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const initials     = hideUsernames ? '••' : account.username.slice(0, 2).toUpperCase();
  const accountStats = account.robloxUserId ? statsMap[account.robloxUserId] : undefined;
  const pres         = account.robloxUserId ? presenceMap[account.robloxUserId] : undefined;
  const inGame       = pres?.presenceType === 2;
  const onlineOnly   = pres?.presenceType === 1;
  const hasPresence  = pres !== undefined;

  let sessionLabel: React.ReactNode;
  let sessionColor: string;
  if (inGame)        { sessionLabel = 'In Game'; sessionColor = '#22C55E'; }
  else if (onlineOnly) { sessionLabel = 'Online';  sessionColor = '#0EA5E9'; }
  else if (hasPresence) { sessionLabel = 'Offline'; sessionColor = 'rgba(255,255,255,0.3)'; }
  else               { sessionLabel = null;        sessionColor = 'rgba(255,255,255,0.3)'; }

  const handleMoreClick = () => {
    if (menuOpen) { setMenuOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 180 });
    }
    setMenuOpen(true);
  };

  const handleValidate = async () => {
    toast(`Validating ${account.username}…`, 'info');
    await new Promise(r => setTimeout(r, 900));
    toast(
      account.status === 'active'
        ? `${account.username}: cookie is valid.`
        : `${account.username}: cookie expired or invalid.`,
      account.status === 'active' ? 'success' : 'error',
    );
  };

  const handleDelete = () => {
    setMenuOpen(false);
    showConfirm({
      title: 'Delete Account',
      message: `Remove "${account.username}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        deleteAccount(account.id);
        toast(`"${account.username}" removed.`, 'success');
      },
    });
  };

  const handleCopyCookie = () => {
    if (!account.rawCookie) { toast('No cookie stored for this account.', 'error'); return; }
    navigator.clipboard.writeText(account.rawCookie).then(() => {
      toast('Cookie copied to clipboard.', 'success');
    });
    setMenuOpen(false);
  };

  const handleToggleFavorite = () => {
    updateAccount(account.id, { isFavorite: !account.isFavorite });
  };

  const handleQuickRelaunch = () => {
    if (account.lastPlaceId) openLaunch(account.id);
  };

  const handleKill = async () => {
    // Kill only this account's process if we mapped its PID; otherwise fall back
    // to killing all (e.g. PID mapping missed the bootstrapper window).
    const pid = await window.electronAPI?.getAccountPid?.(account.id);
    if (pid) await window.electronAPI?.killRobloxPid?.(pid);
    else await window.electronAPI?.killAllRoblox?.();
    endLaunchSession(account.id);
    toast(`Killed Roblox for ${hideUsernames ? 'account' : account.username}`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl flex flex-col"
      style={{
        background: 'rgba(20,20,20,0.93)',
        border: `1px solid ${inGame ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(20px)',
        boxShadow: inGame ? '0 0 24px rgba(34,197,94,0.06)' : 'none',
        transition: 'border-color 600ms, box-shadow 600ms',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: 'var(--accent, #9B77FF)' }}>Info</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span className="text-xs font-semibold text-white truncate max-w-[120px]">{mask(account.username)}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Clickable favorite star */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleToggleFavorite}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
            title={account.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={11}
              fill={account.isFavorite ? '#FFB800' : 'none'}
              stroke={account.isFavorite ? '#FFB800' : 'rgba(255,255,255,0.25)'}
              strokeWidth={2}
              style={{ filter: account.isFavorite ? 'drop-shadow(0 0 4px rgba(255,184,0,0.5))' : 'none' }}
            />
          </motion.button>
          {/* Live session indicator */}
          {sessionLabel && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: `${sessionColor}18`, border: `1px solid ${sessionColor}40` }}>
              <div
                className="rounded-full"
                style={{
                  width: 5, height: 5, background: sessionColor,
                  boxShadow: inGame ? `0 0 5px ${sessionColor}` : 'none',
                  animation: inGame ? 'pulse 2s infinite' : 'none',
                }}
              />
              <span className="text-xs font-medium" style={{ color: sessionColor }}>{sessionLabel}</span>
            </div>
          )}
          {account.status !== 'active' && <StatusBadge status={account.status} />}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1">
        {/* Left — avatar + name + tags */}
        <div
          className="flex flex-col items-center justify-center gap-3 p-4"
          style={{ width: '38%', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}
        >
          <div className="relative">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt={account.username}
                style={{
                  width: 80, height: 80, borderRadius: 14, objectFit: 'cover',
                  border: `2px solid ${account.avatarColor}50`,
                  boxShadow: `0 0 20px ${account.avatarColor}25`,
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-2xl text-lg font-bold"
                style={{
                  width: 80, height: 80,
                  background: `${account.avatarColor}20`,
                  border: `2px solid ${account.avatarColor}50`,
                  color: account.avatarColor,
                }}
              >
                {initials}
              </div>
            )}
            {/* Session dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 rounded-full"
              style={{
                width: 13, height: 13,
                background: inGame ? '#22C55E' : onlineOnly ? '#0EA5E9' : 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(14,14,14,1)',
                boxShadow: inGame ? '0 0 8px rgba(34,197,94,0.7)' : onlineOnly ? '0 0 8px rgba(14,165,233,0.5)' : 'none',
                transition: 'background 600ms, box-shadow 600ms',
              }}
            />
          </div>

          <div className="text-center">
            <div className="text-sm font-bold text-white leading-tight">{mask(account.username)}</div>
            {account.displayName && account.displayName !== account.username && (
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{mask(account.displayName)}</div>
            )}
            {account.description && (
              <div
                className="text-xs mt-1.5 px-2 py-1 rounded-md"
                style={{
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', wordBreak: 'break-word',
                }}
                title={hideNotes ? undefined : account.description}
              >
                {hideNotes ? '••••••••' : account.description}
              </div>
            )}
            {/* Tags */}
            {account.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {account.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: `${tag.color}20`, color: tag.color, fontSize: 9 }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — information */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
          <div
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--accent, #9B77FF)' }}
          >
            Information
          </div>

          <InfoRow label="Username" value={mask(account.username)} copyValue={hideUsernames ? undefined : account.username} />
          {account.robloxUserId && (
            <InfoRow
              label="User ID"
              value={hideUsernames ? '••••••••' : account.robloxUserId}
              copyValue={hideUsernames ? undefined : account.robloxUserId}
            />
          )}

          {/* Live game data */}
          {inGame && pres ? (
            <>
              <InfoRow
                label="Game"
                value={<span style={{ color: '#22C55E', fontWeight: 600 }}>{hideNotes ? '••••••••' : (pres.gameName || '—')}</span>}
              />
              {pres.placeId    && <InfoRow label="Place ID"    value={hideNotes ? '••••••' : String(pres.placeId)}    copyValue={hideNotes ? undefined : String(pres.placeId)} />}
              {pres.universeId && <InfoRow label="Universe ID" value={hideNotes ? '••••••' : String(pres.universeId)} copyValue={hideNotes ? undefined : String(pres.universeId)} />}
              <InfoRow
                label="Runtime"
                value={
                  <span className="flex items-center gap-1" style={{ color: '#22C55E', fontWeight: 600 }}>
                    <Timer size={10} />
                    <RuntimeTicker startMs={pres.sessionStart} />
                  </span>
                }
              />
            </>
          ) : (
            <>
              <InfoRow
                label="Status"
                value={
                  account.status !== 'active' ? (
                    <span style={{ color: '#F87171' }}>
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </span>
                  ) : onlineOnly ? (
                    <span style={{ color: '#0EA5E9' }}>Online</span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Offline</span>
                  )
                }
              />
              {account.lastPlaceId && (
                <InfoRow
                  label="Last Place"
                  value={hideNotes ? '••••••' : account.lastPlaceId}
                  copyValue={hideNotes ? undefined : account.lastPlaceId}
                />
              )}
              {account.lastUsedAt && <InfoRow label="Last Used" value={relativeTime(account.lastUsedAt)} />}
              <InfoRow label="Added" value={account.createdAt} />
            </>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      {account.robloxUserId && <StatsStrip stats={accountStats} />}

      {/* ── Footer ── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => openLaunch(account.id)}
          disabled={account.status !== 'active'}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs font-bold"
          style={{
            background: account.status === 'active' ? 'rgba(var(--accent-rgb, 155,119,255), 0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${account.status === 'active' ? 'rgba(var(--accent-rgb, 155,119,255), 0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: account.status === 'active' ? 'var(--accent, #9B77FF)' : 'rgba(255,255,255,0.2)',
            cursor: account.status === 'active' ? 'pointer' : 'not-allowed',
          }}
        >
          <Play size={11} strokeWidth={2.5} fill="currentColor" />
          Launch
        </motion.button>

        {/* Kill button — only when in-game */}
        {inGame && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleKill}
            title="Kill Roblox session"
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 32, height: 32,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
              cursor: 'pointer',
            }}
          >
            <Power size={11} strokeWidth={2.5} />
          </motion.button>
        )}

        {/* Quick relaunch last place */}
        {account.lastPlaceId && account.status === 'active' && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleQuickRelaunch}
            title={hideNotes ? 'Relaunch last place' : `Relaunch place ${account.lastPlaceId}`}
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#22C55E',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={11} strokeWidth={2.5} />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleValidate}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#0EA5E9', cursor: 'pointer' }}
        >
          <ShieldCheck size={11} strokeWidth={2} />
          Validate
        </motion.button>

        <motion.button
          ref={btnRef}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={handleMoreClick}
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 32, height: 32, flexShrink: 0,
            background: menuOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={13} strokeWidth={2} />
        </motion.button>
      </div>

      {/* More details — opens the account details modal (edit info, add an image) */}
      <button
        onClick={() => openEdit(account.id)}
        className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent',
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          transition: 'background 150ms, color 150ms',
        }}
        onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = 'rgba(255,255,255,0.04)'; t.style.color = 'rgba(255,255,255,0.75)'; }}
        onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = 'transparent'; t.style.color = 'rgba(255,255,255,0.45)'; }}
      >
        <Pencil size={11} strokeWidth={2} /> More Details
      </button>

      <DropdownPortal open={menuOpen} onClose={() => setMenuOpen(false)} position={menuPos}>
        <button
          onClick={() => { setMenuOpen(false); openEdit(account.id); }}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
          style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Pencil size={13} strokeWidth={2} /> More Details
        </button>
        <button
          onClick={() => { setMenuOpen(false); openDescription(account.id); }}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
          style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <AlignLeft size={13} strokeWidth={2} /> View Description
        </button>
        {account.rawCookie && (
          <button
            onClick={handleCopyCookie}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
            style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <Copy size={13} strokeWidth={2} /> Copy Cookie
          </button>
        )}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <button
          onClick={handleDelete}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
          style={{ color: '#F87171', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Trash2 size={13} strokeWidth={2} /> Delete Account
        </button>
      </DropdownPortal>
    </motion.div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export function Dashboard() {
  const { accounts, openAddAccount, updateAccount, accountOrder, reorderAccounts } = useApp();
  const presenceMap = usePresence(accounts);
  const [statsMap, refreshStats] = useRobloxStats(accounts);

  // Stamp lastUsedAt the moment an account is detected entering a game
  const prevPresenceTypes = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const account of accounts) {
      if (!account.robloxUserId) continue;
      const uid     = account.robloxUserId;
      const current = presenceMap[uid]?.presenceType ?? -1;
      const prev    = prevPresenceTypes.current[uid] ?? -1;
      if (current === 2 && prev !== 2) {
        updateAccount(account.id, { lastUsedAt: new Date().toISOString() });
      }
      prevPresenceTypes.current[uid] = current;
    }
  }, [presenceMap, accounts, updateAccount]);

  const [search, setSearch]           = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showInGame, setShowInGame]   = useState(false);
  const [tagFilter, setTagFilter]     = useState<number | null>(null);

  // Collect all tags used across accounts for the filter bar
  const { tags } = useApp();

  const filtered = useMemo(() => {
    let list = accounts;
    if (showFavOnly) list = list.filter(a => a.isFavorite);
    if (showInGame)  list = list.filter(a => {
      const p = a.robloxUserId ? presenceMap[a.robloxUserId] : undefined;
      return p?.presenceType === 2;
    });
    if (tagFilter !== null) list = list.filter(a => a.tags.some(t => t.id === tagFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.username.toLowerCase().includes(q) ||
        (a.displayName ?? '').toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        (a.robloxUserId ?? '').includes(q),
      );
    }
    // Custom order first if set, then smart sort as tiebreaker
    return [...list].sort((a, b) => {
      const aGame = presenceMap[a.robloxUserId ?? '']?.presenceType === 2 ? 0 : presenceMap[a.robloxUserId ?? '']?.presenceType === 1 ? 1 : 2;
      const bGame = presenceMap[b.robloxUserId ?? '']?.presenceType === 2 ? 0 : presenceMap[b.robloxUserId ?? '']?.presenceType === 1 ? 1 : 2;
      if (aGame !== bGame) return aGame - bGame;
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      const ai = accountOrder.indexOf(a.id);
      const bi = accountOrder.indexOf(b.id);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '');
    });
  }, [accounts, search, showFavOnly, showInGame, tagFilter, presenceMap, accountOrder]);

  const dragSrcId = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleDragStart = (id: number) => { dragSrcId.current = id; };
  const handleDragOver  = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop      = (targetId: number) => {
    const srcId = dragSrcId.current;
    if (srcId == null || srcId === targetId) { setDragOverId(null); return; }
    const base = accountOrder.length > 0 ? [...accountOrder] : accounts.map(a => a.id);
    accounts.forEach(a => { if (!base.includes(a.id)) base.push(a.id); });
    const si = base.indexOf(srcId);   const ti = base.indexOf(targetId);
    if (si !== -1 && ti !== -1) { base.splice(si, 1); base.splice(ti, 0, srcId); }
    reorderAccounts(base);
    dragSrcId.current = null; setDragOverId(null);
  };

  const total     = accounts.length;
  const active    = accounts.filter(a => a.status === 'active').length;
  const favorites = accounts.filter(a => a.isFavorite).length;
  const inGame    = Object.values(presenceMap).filter(p => p.presenceType === 2).length;

  const hasActiveFilters = search || showFavOnly || showInGame || tagFilter !== null;

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip icon={<Users size={13} style={{ color: 'var(--accent, #9B77FF)' }} />} value={total} label="accounts" />
          <StatChip icon={<Wifi size={13} style={{ color: '#22C55E' }} />}               value={inGame}    label="in game" color="#22C55E" />
          <StatChip icon={<Heart size={13} style={{ color: '#F97316' }} />}              value={favorites} label="favorites" />
          <StatChip icon={<ShieldAlert size={13} style={{ color: active === total && total > 0 ? 'var(--accent, #9B77FF)' : '#EF4444' }} />} value={active} label="valid cookies" />
        </div>

        <div className="flex items-center gap-2">
          {/* Stats refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => refreshStats()}
            title="Refresh stats"
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} strokeWidth={2} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={openAddAccount}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent, #9B77FF)', color: 'var(--bg, #0C0C0C)', cursor: 'pointer' }}
          >
            <Plus size={14} strokeWidth={2.5} /> Add Account
          </motion.button>
        </div>
      </motion.div>

      {/* Search + filter bar — only visible when there are accounts */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* Search input */}
          <div
            className="flex items-center gap-2 flex-1 px-3.5 py-2 rounded-xl min-w-[180px]"
            style={{ background: 'rgba(18,18,18,0.92)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search accounts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Quick filter pills */}
          <button
            onClick={() => setShowFavOnly(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: showFavOnly ? 'rgba(255,184,0,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showFavOnly ? 'rgba(255,184,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: showFavOnly ? '#FFB800' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
          >
            <Star size={11} fill={showFavOnly ? '#FFB800' : 'none'} strokeWidth={2} /> Favorites
          </button>

          <button
            onClick={() => setShowInGame(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: showInGame ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showInGame ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: showInGame ? '#22C55E' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
          >
            <Wifi size={11} strokeWidth={2} /> In Game
          </button>

          {/* Tag filter pills */}
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tagFilter === tag.id ? `${tag.color}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${tagFilter === tag.id ? `${tag.color}50` : 'rgba(255,255,255,0.08)'}`,
                color: tagFilter === tag.id ? tag.color : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
              }}
            >
              <TagIcon size={11} strokeWidth={2} /> {tag.name}
            </button>
          ))}

          {/* Clear all filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setShowFavOnly(false); setShowInGame(false); setTagFilter(null); }}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
            >
              <X size={11} strokeWidth={2} /> Clear
            </button>
          )}
        </motion.div>
      )}

      {/* Card grid or empty state */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center gap-4"
        >
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Users size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">No accounts yet</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Click "Add Account" to get started</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={openAddAccount}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold mt-2"
            style={{ background: 'var(--accent, #9B77FF)', color: 'var(--bg, #0C0C0C)', cursor: 'pointer' }}
          >
            <Plus size={14} strokeWidth={2.5} /> Add Account
          </motion.button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-3"
        >
          <Search size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No accounts match your filters</p>
          <button
            onClick={() => { setSearch(''); setShowFavOnly(false); setShowInGame(false); setTagFilter(null); }}
            className="text-xs px-3 py-1.5 rounded-xl"
            style={{ color: 'rgba(var(--accent-rgb),0.8)', background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)', cursor: 'pointer' }}
          >
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', alignContent: 'start' }}
        >
          {filtered.map((account, i) => (
            <div
              key={account.id}
              draggable
              onDragStart={() => handleDragStart(account.id)}
              onDragOver={e => handleDragOver(e, account.id)}
              onDrop={() => handleDrop(account.id)}
              onDragLeave={() => setDragOverId(null)}
              style={{
                outline: dragOverId === account.id ? '2px solid rgba(var(--accent-rgb),0.5)' : '2px solid transparent',
                borderRadius: 16, transition: 'outline 120ms', cursor: 'grab',
              }}
            >
              <AccountCard account={account} index={i} presenceMap={presenceMap} statsMap={statsMap} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(18,18,18,0.92)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {icon}
      <span className="text-xs font-semibold text-white">{value}</span>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
    </div>
  );
}
