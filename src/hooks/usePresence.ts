import { useState, useEffect, useCallback } from 'react';
import type { Account } from '../types';

export interface PresenceInfo {
  presenceType: number; // 0=offline 1=online 2=inGame 3=inStudio
  gameName: string;
  placeId: number | null;
  universeId: number | null;
  gameId: string | null;
  sessionStart: number | null; // Date.now() when in-game began
}

export type PresenceMap = Record<string, PresenceInfo>; // keyed by robloxUserId

const POLL_MS = 30_000;
const SESSION_STARTS_KEY = 'ram_session_starts';

// When an in-game session began, keyed by robloxUserId. This lives at module
// scope (not a per-hook useRef) and is persisted to localStorage so the runtime
// counter survives tab switches — which remount the hook — and app restarts.
// Previously each usePresence instance had its own ref, so navigating away from
// and back to a tab reset every runtime to 0.
const sessionStarts: Record<string, number> = (() => {
  try {
    const raw = localStorage.getItem(SESSION_STARTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
})();

function persistSessionStarts() {
  try { localStorage.setItem(SESSION_STARTS_KEY, JSON.stringify(sessionStarts)); } catch {}
}

export function usePresence(accounts: Account[]): PresenceMap {
  const [presence, setPresence] = useState<PresenceMap>({});

  const poll = useCallback(async () => {
    if (!window.electronAPI?.getPresence) return;

    const accts = accounts
      .filter(a => a.robloxUserId && a.rawCookie)
      .map(a => ({ robloxUserId: a.robloxUserId!, cookie: a.rawCookie! }));

    if (accts.length === 0) return;

    try {
      const raw = await window.electronAPI.getPresence(accts);
      if (!raw) return;

      setPresence(prev => {
        const next: PresenceMap = {};
        let changed = false;
        for (const [uid, p] of Object.entries(raw)) {
          const inGame = p.userPresenceType === 2;
          // Start timer when first detected in-game; clear when they leave
          if (inGame && !sessionStarts[uid]) {
            sessionStarts[uid] = Date.now();
            changed = true;
          } else if (!inGame && sessionStarts[uid]) {
            delete sessionStarts[uid];
            changed = true;
          }
          next[uid] = {
            presenceType: p.userPresenceType,
            gameName: p.lastLocation ?? '',
            placeId: p.placeId ?? null,
            universeId: p.universeId ?? null,
            gameId: p.gameId ?? null,
            sessionStart: sessionStarts[uid] ?? null,
          };
        }
        if (changed) persistSessionStarts();
        return next;
      });
    } catch { /* network error — keep stale data */ }
  }, [accounts]);

  // Poll immediately on mount and every POLL_MS
  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return presence;
}

// Formats elapsed milliseconds as H:MM:SS or M:SS
export function formatRuntime(startMs: number | null): string {
  if (!startMs) return '—';
  const elapsed = Math.floor((Date.now() - startMs) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
