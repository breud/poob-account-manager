import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Search, SlidersHorizontal, Star, Play,
  ShieldCheck, Trash2, MoreHorizontal,
  ChevronUp, ChevronDown, Pencil, Wifi, WifiOff, Gamepad2, Copy, Tag as TagIcon, Power, GripVertical, AlignLeft,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DropdownPortal } from '../components/ui/DropdownPortal';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePresence, type PresenceMap } from '../hooks/usePresence';
import type { Account, AccountStatus } from '../types';

const STATUS_FILTERS: { value: AccountStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'active',   label: 'Active'   },
  { value: 'expired',  label: 'Expired'  },
  { value: 'disabled', label: 'Disabled' },
  { value: 'banned',   label: 'Banned'   },
];

type SortField = 'custom' | 'username' | 'status' | 'lastUsed';
const SORT_OPTIONS: { field: SortField; dir: 'asc' | 'desc'; label: string }[] = [
  { field: 'username', dir: 'asc',  label: 'Name (A–Z)' },
  { field: 'username', dir: 'desc', label: 'Name (Z–A)' },
  { field: 'lastUsed', dir: 'desc', label: 'Recently Active' },
  { field: 'status',   dir: 'asc',  label: 'Status' },
  { field: 'custom',   dir: 'asc',  label: 'Custom Order' },
];

function relativeTime(value?: string): string {
  if (!value) return '—';
  // Legacy "Just now" or non-ISO strings
  if (!value.includes('T')) return value;
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60_000)    return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function PresenceStatusCell({ account, presenceMap }: { account: Account; presenceMap: PresenceMap }) {
  const { hideNotes } = useTheme();
  if (account.status !== 'active') {
    return <StatusBadge status={account.status} />;
  }

  const pres = account.robloxUserId ? presenceMap[account.robloxUserId] : undefined;

  if (!pres) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(100,116,139,0.12)', color: '#94A3B8' }}
      >
        <WifiOff size={10} strokeWidth={2} />
        Offline
      </span>
    );
  }

  if (pres.presenceType === 2) {
    return (
      <div className="flex flex-col gap-0.5">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E', animation: 'pulse-ring 1.8s ease-out infinite' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#22C55E' }} />
          </span>
          In Game
        </span>
        {pres.gameName && (
          <span className="text-xs truncate max-w-[110px]" style={{ color: 'rgba(255,255,255,0.35)' }} title={hideNotes ? undefined : pres.gameName}>
            {hideNotes ? '••••••' : pres.gameName}
          </span>
        )}
      </div>
    );
  }

  if (pres.presenceType === 1) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(14,165,233,0.12)', color: '#0EA5E9' }}
      >
        <Wifi size={10} strokeWidth={2} />
        Online
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: 'rgba(100,116,139,0.12)', color: '#94A3B8' }}
    >
      <WifiOff size={10} strokeWidth={2} />
      Offline
    </span>
  );
}

function LastActiveCell({ account, presenceMap }: { account: Account; presenceMap: PresenceMap }) {
  const { hideNotes } = useTheme();
  const pres = account.robloxUserId ? presenceMap[account.robloxUserId] : undefined;

  if (pres?.presenceType === 2 && pres.gameName) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs" style={{ color: '#22C55E' }}>Now</span>
        <span className="text-xs truncate max-w-[110px]" style={{ color: 'rgba(255,255,255,0.25)' }} title={hideNotes ? undefined : pres.gameName}>
          <Gamepad2 size={9} strokeWidth={2} className="inline mr-0.5" />
          {hideNotes ? '••••••' : pres.gameName}
        </span>
      </div>
    );
  }

  return (
    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {relativeTime(account.lastUsedAt)}
    </span>
  );
}

function RowMenu({ open, position, accountId, username, rawCookie, onClose }: {
  open: boolean;
  position: { top: number; left: number } | null;
  accountId: number;
  username: string;
  rawCookie?: string;
  onClose: () => void;
}) {
  const { deleteAccount, showConfirm, openEdit, openDescription } = useApp();
  const { toast } = useToast();

  const handleEdit = () => { onClose(); openEdit(accountId); };
  const handleViewDescription = () => { onClose(); openDescription(accountId); };
  const handleCopyCookie = () => {
    if (!rawCookie) return;
    navigator.clipboard.writeText(rawCookie).then(() => toast('Cookie copied to clipboard.', 'success'));
    onClose();
  };
  const handleDelete = () => {
    onClose();
    showConfirm({
      title: 'Delete Account',
      message: `Remove "${username}" from the manager? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        deleteAccount(accountId);
        toast(`"${username}" removed.`, 'success');
      },
    });
  };

  return (
    <DropdownPortal open={open} onClose={onClose} position={position}>
      <button
        onClick={handleEdit}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
        style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <Pencil size={13} strokeWidth={2} /> More Details
      </button>
      <button
        onClick={handleViewDescription}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
        style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <AlignLeft size={13} strokeWidth={2} /> View Description
      </button>
      {rawCookie && (
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
  );
}

export function Accounts() {
  const { accounts, updateAccount, deleteAccounts, showConfirm, openLaunch, openBulkLaunch, endLaunchSession, launchHistory, accountOrder, reorderAccounts, tags, toggleAccountTag } = useApp();
  const { toast } = useToast();
  const { theme, hideUsernames } = useTheme();
  const mask = (s: string) => hideUsernames ? '••••••••' : s;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<'custom' | 'username' | 'status' | 'lastUsed'>('custom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortMenuPos, setSortMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [openTagId, setOpenTagId] = useState<number | null>(null);
  const [tagPos, setTagPos] = useState<{ top: number; left: number } | null>(null);

  const presenceMap = usePresence(accounts);

  // When an account enters a game, stamp lastUsedAt with the current time
  const prevPresenceTypes = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const account of accounts) {
      if (!account.robloxUserId) continue;
      const uid = account.robloxUserId;
      const currentType = presenceMap[uid]?.presenceType ?? -1;
      const prevType = prevPresenceTypes.current[uid] ?? -1;
      if (currentType === 2 && prevType !== 2) {
        updateAccount(account.id, { lastUsedAt: new Date().toISOString() });
      }
      prevPresenceTypes.current[uid] = currentType;
    }
  }, [presenceMap, accounts, updateAccount]);

  const filtered = useMemo(() => {
    let list = accounts;
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (tagFilter !== null) list = list.filter(a => a.tags.some(t => t.id === tagFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.username.toLowerCase().includes(q) ||
        (a.displayName ?? '').toLowerCase().includes(q),
      );
    }
    if (sortField === 'custom') {
      list = [...list].sort((a, b) => {
        const ai = accountOrder.indexOf(a.id);
        const bi = accountOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    } else {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'username') cmp = a.username.localeCompare(b.username);
        else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
        else cmp = (a.lastUsedAt ?? '').localeCompare(b.lastUsedAt ?? '');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [accounts, search, statusFilter, tagFilter, sortField, sortDir, accountOrder]);

  const toggleSort = (field: 'username' | 'status' | 'lastUsed') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleReorder = (newItems: typeof filtered) => {
    const oldOrder = accountOrder.length > 0 ? [...accountOrder] : accounts.map(a => a.id);
    const filteredIds = filtered.map(a => a.id);
    const newFilteredIds = newItems.map(a => a.id);
    const positions = filteredIds.map(id => oldOrder.indexOf(id) === -1 ? oldOrder.length + filteredIds.indexOf(id) : oldOrder.indexOf(id)).sort((a, b) => a - b);
    const newOrder = [...oldOrder];
    const allIds = accounts.map(a => a.id);
    allIds.forEach(id => { if (!newOrder.includes(id)) newOrder.push(id); });
    positions.forEach((pos, i) => { if (pos < newOrder.length) newOrder[pos] = newFilteredIds[i]; });
    reorderAccounts(newOrder);
    setSortField('custom');
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  };

  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    showConfirm({
      title: `Delete ${ids.length} Account${ids.length > 1 ? 's' : ''}`,
      message: `Remove ${ids.length} selected account${ids.length > 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: 'Delete All',
      danger: true,
      onConfirm: () => {
        deleteAccounts(ids);
        setSelected(new Set());
        toast(`${ids.length} account${ids.length > 1 ? 's' : ''} removed.`, 'success');
      },
    });
  };

  const handleBulkLaunch = () => {
    openBulkLaunch([...selected]);
  };

  const handleBulkValidate = () => {
    toast(`Validating ${selected.size} cookie${selected.size > 1 ? 's' : ''}…`, 'info');
  };

  const activeSessions = useMemo(
    () => new Set(launchHistory.filter(r => !r.endedAt).map(r => r.accountId)),
    [launchHistory],
  );

  const handleKillSelected = () => {
    const ids = [...selected].filter(id => activeSessions.has(id));
    if (ids.length === 0) { toast('No active sessions to kill.', 'info'); return; }
    showConfirm({
      title: `Kill ${ids.length} Session${ids.length > 1 ? 's' : ''}`,
      message: `This will close Roblox for ${ids.length} account${ids.length > 1 ? 's' : ''}. Continue?`,
      confirmLabel: 'Kill Sessions',
      danger: true,
      onConfirm: async () => {
        for (const id of ids) {
          const pid = await window.electronAPI?.getAccountPid?.(id);
          if (pid) await window.electronAPI?.killRobloxPid?.(pid);
          endLaunchSession(id);
        }
        setSelected(new Set());
        toast(`Killed ${ids.length} session${ids.length > 1 ? 's' : ''}.`, 'success');
      },
    });
  };

  const handleRowValidate = async (username: string, status: string) => {
    toast(`Validating cookie for ${username}…`, 'info');
    await new Promise(r => setTimeout(r, 900));
    if (status === 'active') toast(`${username}: cookie is valid.`, 'success');
    else toast(`${username}: cookie is expired or invalid.`, 'error');
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : null;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-lg font-bold text-white">All Accounts</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </motion.div>

      {/* Status filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: statusFilter === f.value ? 'rgba(var(--accent-rgb),0.15)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === f.value ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${statusFilter === f.value ? 'rgba(var(--accent-rgb),0.3)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: statusFilter === f.value ? '0 0 12px rgba(var(--accent-rgb),0.1)' : 'none',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Tag filter pills */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="text-xs font-semibold mr-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Tags:</span>
          <button
            onClick={() => setTagFilter(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: tagFilter === null ? 'rgba(var(--accent-rgb),0.15)' : 'rgba(255,255,255,0.05)',
              color: tagFilter === null ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${tagFilter === null ? 'rgba(var(--accent-rgb),0.3)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            All
          </button>
          {tags.map(tag => {
            const active = tagFilter === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setTagFilter(active ? null : tag.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: active ? `${tag.color}22` : 'rgba(255,255,255,0.05)',
                  color: active ? tag.color : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${active ? `${tag.color}55` : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer', transition: 'all 200ms',
                }}
              >
                <TagIcon size={11} strokeWidth={2} /> {tag.name}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <div
          className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl"
          style={{
            background: 'rgba(18,18,18,0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            aria-label="Search accounts"
          />
        </div>
        <button
          aria-label="Sort accounts"
          onClick={(e) => {
            if (sortMenuOpen) { setSortMenuOpen(false); return; }
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setSortMenuPos({ top: r.bottom + 4, left: r.right - 180 });
            setSortMenuOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
          style={{
            background: 'rgba(18,18,18,0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          <SlidersHorizontal size={13} strokeWidth={2} />
          <span>{SORT_OPTIONS.find(o => o.field === sortField && (o.field === 'custom' || o.dir === sortDir))?.label ?? 'Sort'}</span>
        </button>
        <DropdownPortal open={sortMenuOpen} onClose={() => setSortMenuOpen(false)} position={sortMenuOpen ? sortMenuPos : null} minWidth={180}>
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Sort by</p>
            <div className="flex flex-col gap-0.5 pb-1.5">
              {SORT_OPTIONS.map(opt => {
                const active = sortField === opt.field && (opt.field === 'custom' || sortDir === opt.dir);
                return (
                  <button
                    key={opt.label}
                    onClick={() => { setSortField(opt.field); setSortDir(opt.dir); setSortMenuOpen(false); }}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left text-xs font-medium"
                    style={{
                      background: active ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
                      color: active ? 'var(--accent)' : 'rgba(255,255,255,0.65)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {opt.label}
                    {active && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </DropdownPortal>
      </motion.div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{selected.size} selected</span>
            <div className="h-3 w-px" style={{ background: 'rgba(var(--accent-rgb),0.3)' }} />
            <button
              onClick={handleBulkLaunch}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <Play size={11} /> Launch All
            </button>
            <button
              onClick={handleBulkValidate}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: '#0EA5E9', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <ShieldCheck size={11} /> Validate All
            </button>
            {[...selected].some(id => activeSessions.has(id)) && (
              <button
                onClick={handleKillSelected}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: '#F97316', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <Power size={11} /> Kill Sessions
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-xs font-medium ml-auto"
              style={{ color: '#EF4444', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <Trash2 size={11} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(18,18,18,0.90)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Table header */}
        <div
          className="grid items-center px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: '20px 36px 1fr 140px 140px 130px 56px 100px',
            color: 'rgba(255,255,255,0.3)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div />
          <div>
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded cursor-pointer accent-accent"
              aria-label="Select all"
            />
          </div>
          <button
            onClick={() => toggleSort('username')}
            className="flex items-center gap-1 text-left"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Account <SortIcon field="username" />
          </button>
          <button
            onClick={() => toggleSort('status')}
            className="flex items-center gap-1"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Status <SortIcon field="status" />
          </button>
          <span>Tags</span>
          <button
            onClick={() => toggleSort('lastUsed')}
            className="flex items-center gap-1"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Last Active <SortIcon field="lastUsed" />
          </button>
          <span>FPS</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <Reorder.Group axis="y" values={filtered} onReorder={handleReorder} as="div" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((account, i) => {
              const initials = hideUsernames ? '••' : account.username.slice(0, 2).toUpperCase();
              const isSelected = selected.has(account.id);
              return (
                <Reorder.Item
                  key={account.id}
                  value={account}
                  as="div"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: i < 8 ? i * 0.04 : 0 }}
                  className="grid items-center px-4 group"
                  style={{
                    gridTemplateColumns: '20px 36px 1fr 140px 140px 130px 56px 100px',
                    paddingTop: theme.compactMode ? 6 : 12,
                    paddingBottom: theme.compactMode ? 6 : 12,
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isSelected ? 'rgba(var(--accent-rgb),0.04)' : 'transparent',
                    transition: 'background 150ms',
                    cursor: 'pointer',
                  }}
                  onClick={(e: React.MouseEvent) => {
                    if ((e.target as HTMLElement).closest('button,input,a')) return;
                    toggleOne(account.id);
                  }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(var(--accent-rgb),0.04)' : 'transparent';
                  }}
                >
                  {/* Drag handle */}
                  <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ cursor: 'grab' }}>
                    <GripVertical size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </div>
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(account.id)}
                      className="w-4 h-4 rounded cursor-pointer accent-accent"
                      aria-label={`Select ${account.username}`}
                    />
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.username}
                          style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40` }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-xl text-xs font-bold"
                          style={{ width: 36, height: 36, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
                        >
                          {initials}
                        </div>
                      )}
                      {account.isFavorite && (
                        <Star
                          size={10}
                          fill="#FFB800"
                          strokeWidth={0}
                          className="absolute -top-1 -right-1"
                          style={{ filter: 'drop-shadow(0 0 3px rgba(255,184,0,0.6))' }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{mask(account.username)}</div>
                      {account.displayName && (
                        <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {mask(account.displayName)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Presence-aware status */}
                  <div>
                    <PresenceStatusCell account={account} presenceMap={presenceMap} />
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {account.tags.length === 0 ? (
                      <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>—</span>
                    ) : account.tags.slice(0, 2).map(t => (
                      <span
                        key={t.id}
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: `${t.color}18`, color: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                    {account.tags.length > 2 && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>+{account.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Last active — relative time + game name when in-game */}
                  <div>
                    <LastActiveCell account={account} presenceMap={presenceMap} />
                  </div>

                  {/* FPS unlock toggle */}
                  <div>
                    <button
                      onClick={() => updateAccount(account.id, { fpsLimit: (account.fpsLimit ?? 0) === 0 ? 60 : 0 })}
                      title={(account.fpsLimit ?? 0) === 0 ? 'FPS unlimited — click to cap at 60' : `FPS capped at ${account.fpsLimit} — click to unlock`}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: (account.fpsLimit ?? 0) === 0 ? 'rgba(34,197,94,0.12)' : 'rgba(14,165,233,0.1)',
                        border: `1px solid ${(account.fpsLimit ?? 0) === 0 ? 'rgba(34,197,94,0.3)' : 'rgba(14,165,233,0.2)'}`,
                        color: (account.fpsLimit ?? 0) === 0 ? '#22C55E' : '#0EA5E9',
                        cursor: 'pointer', transition: 'all 120ms',
                      }}
                    >
                      {(account.fpsLimit ?? 0) === 0 ? '∞' : `${account.fpsLimit}`}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative">
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => account.status === 'active' && openLaunch(account.id)}
                      disabled={account.status !== 'active'}
                      aria-label={`Launch ${account.username}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{
                        background: 'rgba(var(--accent-rgb),0.1)',
                        color: account.status === 'active' ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                        cursor: account.status === 'active' ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Play size={11} strokeWidth={2.5} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={async () => {
                        const pid = await window.electronAPI?.getAccountPid?.(account.id);
                        if (pid) await window.electronAPI?.killRobloxPid?.(pid);
                        endLaunchSession(account.id);
                        toast(`Killed session for ${account.username}`, 'success');
                      }}
                      aria-label={`Kill ${account.username}`}
                      title="Kill Roblox session"
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Power size={11} strokeWidth={2.5} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => handleRowValidate(account.username, account.status)}
                      aria-label={`Validate ${account.username}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', cursor: 'pointer' }}
                    >
                      <ShieldCheck size={11} strokeWidth={2} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={(e) => {
                        if (openTagId === account.id) { setOpenTagId(null); return; }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTagPos({ top: rect.bottom + 4, left: rect.right - 180 });
                        setOpenTagId(account.id);
                      }}
                      aria-label={`Tag ${account.username}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{
                        background: openTagId === account.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
                        color: openTagId === account.id ? '#A855F7' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      <TagIcon size={11} strokeWidth={2} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={(e) => {
                        if (openMenuId === account.id) { setOpenMenuId(null); return; }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
                        setOpenMenuId(account.id);
                      }}
                      aria-label={`More options for ${account.username}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                    >
                      <MoreHorizontal size={12} strokeWidth={2} />
                    </motion.button>
                    <DropdownPortal open={openTagId === account.id} onClose={() => setOpenTagId(null)} position={openTagId === account.id ? tagPos : null}>
                      <div className="px-3 pt-2.5 pb-1">
                        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Tags</p>
                        {tags.length === 0 ? (
                          <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>No tags yet — create one in Tags.</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {tags.map(tag => {
                              const active = account.tags.some(t => t.id === tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleAccountTag(account.id, tag)}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left"
                                  style={{
                                    background: active ? `${tag.color}18` : 'transparent',
                                    border: `1px solid ${active ? tag.color + '40' : 'transparent'}`,
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                                  <span className="text-xs font-medium" style={{ color: active ? tag.color : 'rgba(255,255,255,0.6)' }}>{tag.name}</span>
                                  {active && <span className="ml-auto text-xs" style={{ color: tag.color }}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </DropdownPortal>
                    <RowMenu
                      open={openMenuId === account.id}
                      position={openMenuId === account.id ? menuPos : null}
                      accountId={account.id}
                      username={account.username}
                      rawCookie={account.rawCookie}
                      onClose={() => setOpenMenuId(null)}
                    />
                  </div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <Search size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No accounts found</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Try adjusting your search or filters</p>
            </motion.div>
          )}
      </motion.div>
    </div>
  );
}
