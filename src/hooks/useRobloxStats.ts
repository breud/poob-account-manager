import { useState, useEffect, useCallback } from 'react';
import type { Account } from '../types';

export interface RobloxStats {
  robux:     number | null;
  joinDate:  string | null;
  friends:   number | null;
  followers: number | null;
}

export type StatsMap = Record<string, RobloxStats>;

const POLL_MS   = 5 * 60 * 1000;
const CACHE_KEY = 'ram_stats_cache';

function loadCache(): StatsMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StatsMap) : {};
  } catch { return {}; }
}

function saveCache(s: StatsMap) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

export function useRobloxStats(accounts: Account[]): [StatsMap, () => void] {
  const [stats, setStats] = useState<StatsMap>(loadCache);

  const poll = useCallback(async () => {
    if (!window.electronAPI?.getRobloxStats) return;
    const accts = accounts
      .filter(a => a.robloxUserId && a.rawCookie)
      .map(a => ({ robloxUserId: a.robloxUserId!, cookie: a.rawCookie! }));
    if (accts.length === 0) return;
    try {
      const raw = await window.electronAPI.getRobloxStats(accts);
      if (raw) {
        setStats(prev => {
          const next = { ...prev, ...raw };
          saveCache(next);
          return next;
        });
      }
    } catch {}
  }, [accounts]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return [stats, poll];
}

export function fmtNumber(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${(n / 1000).toFixed(0)}K`;
  if (n >= 1_000)     return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function fmtRobux(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `R$${(n / 1000).toFixed(0)}K`;
  if (n >= 1_000)     return `R$${(n / 1000).toFixed(1)}K`;
  return `R$${n.toLocaleString()}`;
}

export function fmtJoinDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return '—'; }
}
