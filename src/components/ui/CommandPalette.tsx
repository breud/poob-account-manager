import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Play, Pencil, LayoutDashboard, Users, Monitor,
  Tag, Settings, Plus, RefreshCw, Gamepad2, Download,
  ArrowRight, Command,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { PresenceMap } from '../../hooks/usePresence';
import type { Page } from '../../types';
import type { Account } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { kind: 'nav'; page: Page; label: string; icon: LucideIcon; shortcut: string };
type ActionItem = { kind: 'action'; id: string; label: string; icon: LucideIcon; onSelect: () => void };
type AccountItem = { kind: 'account'; account: Account };
type ResultItem = AccountItem | NavItem | ActionItem;

// ─── Static nav & action lists ────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { kind: 'nav', page: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, shortcut: 'Ctrl+1' },
  { kind: 'nav', page: 'accounts',  label: 'Accounts',   icon: Users,           shortcut: 'Ctrl+2' },
  { kind: 'nav', page: 'sessions',  label: 'Sessions',   icon: Monitor,         shortcut: 'Ctrl+3' },
  { kind: 'nav', page: 'tags',      label: 'Tags',        icon: Tag,             shortcut: 'Ctrl+4' },
  { kind: 'nav', page: 'settings',  label: 'Settings',   icon: Settings,        shortcut: 'Ctrl+5' },
];

// ─── Highlight matching text ──────────────────────────────────────────────────

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: 'var(--accent, #9B77FF)', fontWeight: 700 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Presence dot ─────────────────────────────────────────────────────────────

function PresenceDot({ type }: { type: number }) {
  const color = type === 2 ? '#22C55E' : type === 1 ? '#0EA5E9' : 'rgba(255,255,255,0.2)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7, height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: type === 2 ? `0 0 5px ${color}` : 'none',
      }}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  presenceMap: PresenceMap;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose, presenceMap }: Props) {
  const { accounts, navigate, openLaunch, openEdit, openAddAccount } = useApp();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setFocused(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const actionItems: ActionItem[] = useMemo(() => [
    { kind: 'action', id: 'add', label: 'Add Account', icon: Plus, onSelect: () => { openAddAccount(); onClose(); } },
    { kind: 'action', id: 'refresh', label: 'Refresh Presence', icon: RefreshCw, onSelect: () => onClose() },
    { kind: 'action', id: 'export', label: 'Export Accounts', icon: Download, onSelect: () => onClose() },
  ], [openAddAccount, onClose]);

  // Build flat result list for keyboard navigation
  const items = useMemo((): ResultItem[] => {
    const q = query.toLowerCase().trim();

    if (!q) {
      // Default state: in-game accounts first, then recently used, then nav + actions
      const inGame = accounts.filter(a => a.robloxUserId && presenceMap[a.robloxUserId]?.presenceType === 2);
      const recent = accounts
        .filter(a => {
          const uid = a.robloxUserId;
          return !inGame.includes(a) && a.lastUsedAt && (uid ? presenceMap[uid]?.presenceType !== 2 : true);
        })
        .sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''))
        .slice(0, 5);

      return [
        ...inGame.map(a => ({ kind: 'account' as const, account: a })),
        ...recent.map(a => ({ kind: 'account' as const, account: a })),
        ...NAV_ITEMS,
        ...actionItems,
      ];
    }

    // Search mode
    const matchedAccounts = accounts.filter(a =>
      a.username.toLowerCase().includes(q) ||
      (a.displayName ?? '').toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      (a.robloxUserId ?? '').includes(q),
    ).map(a => ({ kind: 'account' as const, account: a }));

    const matchedNav = NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q));
    const matchedActions = actionItems.filter(a => a.label.toLowerCase().includes(q));

    return [...matchedAccounts, ...matchedNav, ...matchedActions];
  }, [query, accounts, presenceMap, actionItems]);

  // Clamp focused index
  useEffect(() => {
    setFocused(f => Math.min(f, Math.max(0, items.length - 1)));
  }, [items.length]);

  // Scroll focused item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[focused] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const handleSelect = useCallback((item: ResultItem) => {
    if (item.kind === 'account') {
      openLaunch(item.account.id);
      onClose();
    } else if (item.kind === 'nav') {
      navigate(item.page);
      onClose();
    } else {
      item.onSelect();
    }
  }, [navigate, openLaunch, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, items.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (items[focused]) handleSelect(items[focused]); }
  };

  // Section labels for grouping
  const getSectionLabel = (item: ResultItem, idx: number): string | null => {
    const prev = items[idx - 1];
    if (idx === 0 || (prev?.kind !== item.kind)) {
      if (item.kind === 'account') {
        if (!query) {
          const inGame = accounts.filter(a => a.robloxUserId && presenceMap[a.robloxUserId]?.presenceType === 2);
          if (idx === 0 && inGame.length > 0) return 'In Game';
          if (idx === inGame.length) return 'Recent';
        }
        return query ? 'Accounts' : null;
      }
      if (item.kind === 'nav')    return 'Navigation';
      if (item.kind === 'action') return 'Actions';
    }
    // Handle transition from in-game to recent accounts
    if (!query && item.kind === 'account') {
      const inGame = accounts.filter(a => a.robloxUserId && presenceMap[a.robloxUserId]?.presenceType === 2);
      if (idx === inGame.length && inGame.length > 0) return 'Recent';
    }
    return null;
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center"
          style={{ paddingTop: '12vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{    opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: 'spring', stiffness: 480, damping: 36 }}
            style={{
              width: '100%',
              maxWidth: 560,
              margin: '0 16px',
              background: 'rgba(12,12,12,0.99)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4"
              style={{
                height: 56,
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Search size={17} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setFocused(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search accounts, actions, pages…"
                className="flex-1 bg-transparent text-sm text-white outline-none"
                style={{ letterSpacing: '-0.005em' }}
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, transition: 'color 150ms' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              ) : (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Command size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>K</span>
                </div>
              )}
            </div>

            {/* Results */}
            <div
              ref={listRef}
              style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 0' }}
            >
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Search size={22} style={{ color: 'rgba(255,255,255,0.12)' }} />
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No results for "{query}"</p>
                </div>
              ) : (
                items.map((item, i) => {
                  const sectionLabel = getSectionLabel(item, i);
                  const isFocused = focused === i;

                  return (
                    <div key={
                      item.kind === 'account' ? `a-${item.account.id}` :
                      item.kind === 'nav' ? `n-${item.page}` :
                      `x-${item.id}`
                    }>
                      {sectionLabel && (
                        <div
                          className="px-4 py-1.5 section-label"
                          style={{ marginTop: i > 0 ? 4 : 0 }}
                        >
                          {sectionLabel}
                        </div>
                      )}

                      {item.kind === 'account' && (
                        <AccountRow
                          account={item.account}
                          presenceMap={presenceMap}
                          query={query}
                          isFocused={isFocused}
                          onFocus={() => setFocused(i)}
                          onSelect={() => handleSelect(item)}
                          onEdit={() => { openEdit(item.account.id); onClose(); }}
                        />
                      )}

                      {item.kind === 'nav' && (
                        <NavRow
                          item={item}
                          query={query}
                          isFocused={isFocused}
                          onFocus={() => setFocused(i)}
                          onSelect={() => handleSelect(item)}
                        />
                      )}

                      {item.kind === 'action' && (
                        <ActionRow
                          item={item}
                          query={query}
                          isFocused={isFocused}
                          onFocus={() => setFocused(i)}
                          onSelect={() => handleSelect(item)}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <Kbd label="↑↓" desc="navigate" />
                <Kbd label="↵" desc="select" />
                <Kbd label="Esc" desc="close" />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                {items.length} result{items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── Sub-rows ─────────────────────────────────────────────────────────────────

function AccountRow({
  account, presenceMap, query, isFocused, onFocus, onSelect, onEdit,
}: {
  account: Account;
  presenceMap: PresenceMap;
  query: string;
  isFocused: boolean;
  onFocus: () => void;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const { hideUsernames, hideNotes } = useTheme();
  const mask = (s: string) => hideUsernames ? '••••••••' : s;
  const pres = account.robloxUserId ? presenceMap[account.robloxUserId] : undefined;
  const inGame = pres?.presenceType === 2;
  const online = pres?.presenceType === 1;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 group/row cursor-pointer"
      style={{
        background: isFocused ? 'rgba(255,255,255,0.07)' : 'transparent',
        transition: 'background 120ms',
      }}
      onMouseEnter={onFocus}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt={account.username}
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40` }} />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg text-xs font-bold"
            style={{ width: 32, height: 32, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
          >
            {hideUsernames ? '••' : account.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: '50%',
          background: inGame ? '#22C55E' : online ? '#0EA5E9' : 'rgba(255,255,255,0.18)',
          border: '1.5px solid #0C0C0C',
          boxShadow: inGame ? '0 0 5px rgba(34,197,94,0.7)' : 'none',
        }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate leading-snug">
          {hideUsernames
            ? <span style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>••••••••</span>
            : <Highlighted text={account.username} query={query} />}
        </div>
        <div className="text-xs truncate leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {inGame && pres?.gameName ? (
            <span className="flex items-center gap-1" style={{ color: '#22C55E' }}>
              <Gamepad2 size={9} strokeWidth={2} style={{ display: 'inline', flexShrink: 0 }} />
              {hideNotes ? '••••••' : pres.gameName}
            </span>
          ) : online ? (
            <span style={{ color: '#0EA5E9' }}>Online</span>
          ) : account.tags.length > 0 ? (
            account.tags.map(t => t.name).join(', ')
          ) : account.status !== 'active' ? (
            account.status.charAt(0).toUpperCase() + account.status.slice(1)
          ) : (
            'Offline'
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity" style={{ opacity: isFocused ? 1 : undefined }}>
        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.25)', cursor: 'pointer', transition: 'background 120ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.22)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.12)')}
        >
          <Play size={9} strokeWidth={2.5} fill="currentColor" /> Launch
        </button>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 120ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}
        >
          <Pencil size={9} strokeWidth={2} /> Edit
        </button>
      </div>
    </div>
  );
}

function NavRow({ item, query, isFocused, onFocus, onSelect }: {
  item: NavItem; query: string; isFocused: boolean; onFocus: () => void; onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
      style={{ background: isFocused ? 'rgba(255,255,255,0.07)' : 'transparent', transition: 'background 120ms' }}
      onMouseEnter={onFocus}
      onClick={onSelect}
    >
      <div className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <Highlighted text={item.label} query={query} />
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.shortcut.split('+').map((k, i) => (
          <kbd key={i}
            style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}>
            {k}
          </kbd>
        ))}
      </div>
      <ArrowRight size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
    </div>
  );
}

function ActionRow({ item, query, isFocused, onFocus, onSelect }: {
  item: ActionItem; query: string; isFocused: boolean; onFocus: () => void; onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
      style={{ background: isFocused ? 'rgba(255,255,255,0.07)' : 'transparent', transition: 'background 120ms' }}
      onMouseEnter={onFocus}
      onClick={onSelect}
    >
      <div className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <Highlighted text={item.label} query={query} />
      </span>
    </div>
  );
}

function Kbd({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <kbd style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>
        {label}
      </kbd>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{desc}</span>
    </div>
  );
}
