import {
  createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode,
} from 'react';
import type { Account, AccountStatus, Page, Tag } from '../types';

export interface LaunchRecord {
  id: number;
  accountId: number;
  accountUsername: string;
  avatarColor: string;
  avatarUrl?: string;
  placeId: string;
  startedAt: string;     // when Launch was clicked
  inGameAt?: string;     // when the account was first detected actually in-game
  endedAt?: string;
}

export interface NewAccountData {
  username: string;
  rawCookie: string;
  notes?: string;
  isFavorite: boolean;
  avatarUrl?: string;
  robloxUserId?: string;
  displayName?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
}

interface AppContextValue {
  accounts: Account[];
  addAccount: (data: NewAccountData) => void;
  importAccounts: (data: Partial<Account>[]) => number;
  deleteAccount: (id: number) => void;
  deleteAccounts: (ids: number[]) => void;
  updateAccount: (id: number, updates: Partial<Account>) => void;
  clearAllData: () => void;

  tags: Tag[];
  addTag: (name: string, color: string) => void;
  deleteTag: (id: number) => void;
  toggleAccountTag: (accountId: number, tag: Tag) => void;

  accountOrder: number[];
  reorderAccounts: (ids: number[]) => void;

  launchHistory: LaunchRecord[];
  recordLaunch: (accountId: number, placeId: string, username: string, avatarColor: string, avatarUrl?: string) => void;
  markSessionInGame: (accountId: number) => void;
  endLaunchSession: (accountId: number) => void;

  activePage: Page;
  navigate: (page: Page) => void;

  isAddAccountOpen: boolean;
  openAddAccount: () => void;
  closeAddAccount: () => void;

  launchAccountId: number | null;
  openLaunch: (id: number) => void;
  closeLaunch: () => void;

  bulkLaunchIds: number[];
  openBulkLaunch: (ids: number[]) => void;
  closeBulkLaunch: () => void;

  editAccountId: number | null;
  openEdit: (id: number) => void;
  closeEdit: () => void;

  descriptionAccountId: number | null;
  openDescription: (id: number) => void;
  closeDescription: () => void;

  confirmOptions: ConfirmOptions | null;
  showConfirm: (opts: ConfirmOptions) => void;
  closeConfirm: () => void;

  isCmdOpen: boolean;
  openCmd: () => void;
  closeCmd: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY  = 'ram_accounts';
const TAGS_KEY     = 'ram_tags';
const SESSIONS_KEY = 'ram_launch_history';
const ORDER_KEY    = 'ram_account_order';

function loadTags(): Tag[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? (JSON.parse(raw) as Tag[]) : [];
  } catch { return []; }
}

// Notes were merged into Description. Fold any legacy note into the description
// (when the description is empty) so no data is lost, and drop the note.
function migrateNotes(list: Account[]): Account[] {
  return list.map(a =>
    a.notes && !a.description?.trim()
      ? { ...a, description: a.notes, notes: undefined }
      : a.notes
        ? { ...a, notes: undefined }
        : a,
  );
}

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateNotes(JSON.parse(raw) as Account[]) : [];
  } catch { return []; }
}

function loadLaunchHistory(): LaunchRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as LaunchRecord[]) : [];
    // Close any sessions that were still active when the app last closed.
    // Without this, sessions have no endedAt and show "Active" with an ever-growing
    // duration (e.g. "3 days") after an app restart.
    const now = new Date().toISOString();
    const closed = parsed.map(r => r.endedAt ? r : { ...r, endedAt: now });
    return closed.slice(-200);
  } catch { return []; }
}

let nextTagId = (() => {
  const saved = loadTags();
  return saved.length > 0 ? Math.max(...saved.map(t => t.id)) + 1 : 1;
})();

let nextSessionId = (() => {
  const saved = loadLaunchHistory();
  return saved.length > 0 ? Math.max(...saved.map(s => s.id)) + 1 : 1;
})();

const AVATAR_COLORS = [
  'var(--accent)','#0EA5E9','#A855F7','#F97316',
  '#FFB800','#10B981','#06B6D4','#8B5CF6','#EC4899','#EF4444',
];

let nextId = (() => {
  const saved = loadAccounts();
  return saved.length > 0 ? Math.max(...saved.map(a => a.id)) + 1 : 1;
})();

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [tags, setTags]         = useState<Tag[]>(loadTags);
  const [launchHistory, setLaunchHistory] = useState<LaunchRecord[]>(loadLaunchHistory);
  const fileLoaded = useRef(false);

  // Persist tags
  useEffect(() => {
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); } catch {}
  }, [tags]);

  // Persist launch history
  useEffect(() => {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(launchHistory)); } catch {}
  }, [launchHistory]);

  const addTag = useCallback((name: string, color: string) => {
    const tag: Tag = { id: nextTagId++, name, color };
    setTags(prev => [...prev, tag]);
  }, []);

  const deleteTag = useCallback((id: number) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setAccounts(prev => prev.map(a => ({ ...a, tags: a.tags.filter(t => t.id !== id) })));
  }, []);

  const toggleAccountTag = useCallback((accountId: number, tag: Tag) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== accountId) return a;
      const has = a.tags.some(t => t.id === tag.id);
      return { ...a, tags: has ? a.tags.filter(t => t.id !== tag.id) : [...a.tags, tag] };
    }));
  }, []);

  const [accountOrder, setAccountOrder] = useState<number[]>(() => {
    try { const r = localStorage.getItem(ORDER_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const reorderAccounts = useCallback((ids: number[]) => {
    setAccountOrder(ids);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)); } catch {}
  }, []);

  const [activePage, setActivePage]         = useState<Page>('dashboard');
  const [isAddAccountOpen, setAddAccountOpen] = useState(false);
  const [launchAccountId, setLaunchAccountId] = useState<number | null>(null);
  const [bulkLaunchIds, setBulkLaunchIds]   = useState<number[]>([]);
  const [editAccountId, setEditAccountId]   = useState<number | null>(null);
  const [descriptionAccountId, setDescriptionAccountId] = useState<number | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  // Load from file on mount
  useEffect(() => {
    if (!window.electronAPI?.loadAccounts) { fileLoaded.current = true; return; }
    window.electronAPI.loadAccounts().then(saved => {
      if (Array.isArray(saved) && saved.length > 0) {
        const migrated = migrateNotes(saved as Account[]);
        const maxId = Math.max(...migrated.map((a: Account) => a.id));
        if (maxId >= nextId) nextId = maxId + 1;
        setAccounts(migrated);
      }
      fileLoaded.current = true;
    }).catch(() => { fileLoaded.current = true; });
  }, []);

  // Write to file + localStorage on every change
  useEffect(() => {
    if (!fileLoaded.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts)); } catch {}
    window.electronAPI?.saveAccounts?.(accounts);
  }, [accounts]);

  const addAccount = useCallback((data: NewAccountData) => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const today = new Date().toISOString().split('T')[0];
    setAccounts(prev => [
      ...prev,
      {
        id: nextId++,
        username: data.username.trim(),
        displayName: data.displayName,
        avatarColor: color,
        avatarUrl: data.avatarUrl ?? undefined,
        robloxUserId: data.robloxUserId ?? undefined,
        status: 'active' as AccountStatus,
        isFavorite: data.isFavorite,
        description: data.notes?.trim() || undefined,
        rawCookie: data.rawCookie,
        lastUsedAt: new Date().toISOString(),
        createdAt: today,
        groups: [],
        tags: [],
      },
    ]);
    setAddAccountOpen(false);
  }, []);

  const importAccounts = useCallback((data: Partial<Account>[]): number => {
    let added = 0;
    setAccounts(prev => {
      const existingUsernames = new Set(prev.map(a => a.username.toLowerCase()));
      const toAdd: Account[] = [];
      for (const d of data) {
        if (!d.username) continue;
        if (existingUsernames.has(d.username.toLowerCase())) continue;
        existingUsernames.add(d.username.toLowerCase());
        toAdd.push({
          id: nextId++,
          username: d.username,
          displayName: d.displayName,
          avatarColor: d.avatarColor ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          avatarUrl: d.avatarUrl,
          robloxUserId: d.robloxUserId,
          status: (d.status as AccountStatus) ?? 'active',
          isFavorite: d.isFavorite ?? false,
          description: d.description ?? d.notes,  // fold legacy notes into description
          descriptionImages: d.descriptionImages,
          rawCookie: d.rawCookie ?? '',
          lastUsedAt: d.lastUsedAt,
          lastPlaceId: d.lastPlaceId,
          createdAt: d.createdAt ?? new Date().toISOString().split('T')[0],
          groups: [],
          tags: [],
        });
        added++;
      }
      return [...prev, ...toAdd];
    });
    return added;
  }, []);

  const deleteAccount  = useCallback((id: number) => setAccounts(prev => prev.filter(a => a.id !== id)), []);
  const deleteAccounts = useCallback((ids: number[]) => {
    const set = new Set(ids);
    setAccounts(prev => prev.filter(a => !set.has(a.id)));
  }, []);

  const updateAccount = useCallback((id: number, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTags([]);
    setLaunchHistory([]);
    setAccountOrder([]);
    // Reset id counters so a fresh start doesn't keep climbing from old maxes
    nextId = 1; nextTagId = 1; nextSessionId = 1;
    // Wipe persisted data (accounts file is cleared by the accounts effect)
    for (const key of [STORAGE_KEY, TAGS_KEY, SESSIONS_KEY, ORDER_KEY, 'ram_stats_cache', 'ram_last_place_id']) {
      try { localStorage.removeItem(key); } catch {}
    }
    window.electronAPI?.saveAccounts?.([]);
  }, []);

  const recordLaunch = useCallback((
    accountId: number,
    placeId: string,
    username: string,
    avatarColor: string,
    avatarUrl?: string,
  ) => {
    const record: LaunchRecord = {
      id: nextSessionId++,
      accountId,
      accountUsername: username,
      avatarColor,
      avatarUrl,
      placeId,
      startedAt: new Date().toISOString(),
    };
    setLaunchHistory(prev => [...prev.slice(-199), record]);
  }, []);

  // Stamp the most recent active record for this account with the moment it was
  // actually detected in-game. Durations are measured from this (falling back to
  // startedAt) so launch history reflects play time, not bootstrapper load time.
  const markSessionInGame = useCallback((accountId: number) => {
    setLaunchHistory(prev => {
      const idx = [...prev].reverse().findIndex(r => r.accountId === accountId && !r.endedAt);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      if (prev[realIdx].inGameAt) return prev;
      const next = [...prev];
      next[realIdx] = { ...next[realIdx], inGameAt: new Date().toISOString() };
      return next;
    });
  }, []);

  const endLaunchSession = useCallback((accountId: number) => {
    setLaunchHistory(prev => {
      const idx = [...prev].reverse().findIndex(r => r.accountId === accountId && !r.endedAt);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const next = [...prev];
      next[realIdx] = { ...next[realIdx], endedAt: new Date().toISOString() };
      return next;
    });
  }, []);

  const navigate        = useCallback((page: Page) => setActivePage(page), []);
  const openCmd         = useCallback(() => setIsCmdOpen(true),  []);
  const closeCmd        = useCallback(() => setIsCmdOpen(false), []);
  const openAddAccount  = useCallback(() => setAddAccountOpen(true),  []);
  const closeAddAccount = useCallback(() => setAddAccountOpen(false), []);
  const openLaunch      = useCallback((id: number) => {
    const alreadyRunning = launchHistory.some(r => r.accountId === id && !r.endedAt);
    if (alreadyRunning) {
      setConfirmOptions({
        title: 'Already Running',
        message: 'This account is already launched. Close it first before launching again.',
        confirmLabel: 'OK',
        danger: false,
        hideCancel: true,
        onConfirm: () => {},
      });
      return;
    }
    setLaunchAccountId(id);
  }, [launchHistory]);
  const closeLaunch     = useCallback(() => setLaunchAccountId(null), []);
  const openBulkLaunch  = useCallback((ids: number[]) => setBulkLaunchIds(ids), []);
  const closeBulkLaunch = useCallback(() => setBulkLaunchIds([]), []);
  const openEdit        = useCallback((id: number) => setEditAccountId(id),  []);
  const closeEdit       = useCallback(() => setEditAccountId(null), []);
  const openDescription  = useCallback((id: number) => setDescriptionAccountId(id), []);
  const closeDescription = useCallback(() => setDescriptionAccountId(null), []);
  const showConfirm     = useCallback((opts: ConfirmOptions) => setConfirmOptions(opts), []);
  const closeConfirm    = useCallback(() => setConfirmOptions(null), []);

  return (
    <AppContext.Provider value={{
      accounts, addAccount, importAccounts, deleteAccount, deleteAccounts, updateAccount, clearAllData,
      tags, addTag, deleteTag, toggleAccountTag,
      accountOrder, reorderAccounts,
      launchHistory, recordLaunch, markSessionInGame, endLaunchSession,
      activePage, navigate,
      isAddAccountOpen, openAddAccount, closeAddAccount,
      launchAccountId, openLaunch, closeLaunch,
      bulkLaunchIds, openBulkLaunch, closeBulkLaunch,
      editAccountId, openEdit, closeEdit,
      descriptionAccountId, openDescription, closeDescription,
      confirmOptions, showConfirm, closeConfirm,
      isCmdOpen, openCmd, closeCmd,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
