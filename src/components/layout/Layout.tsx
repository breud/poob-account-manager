import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AmbientBackground } from '../background/AmbientBackground';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '../ui/CommandPalette';
import { useApp } from '../../context/AppContext';
import { usePresence } from '../../hooks/usePresence';
import { Dashboard } from '../../pages/Dashboard';
import { Accounts } from '../../pages/Accounts';
import { Sessions } from '../../pages/Sessions';
import { Tags } from '../../pages/Tags';
import { Settings } from '../../pages/Settings';
import { Statistics } from '../../pages/Statistics';
import type { Page } from '../../types';

const PAGE_COMPONENTS: Record<Page, React.ComponentType> = {
  dashboard:   Dashboard,
  accounts:    Accounts,
  sessions:    Sessions,
  tags:        Tags,
  statistics:  Statistics,
  settings:    Settings,
};

function SidebarPanelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="0.75" y="1.25" width="3.75" height="11.5" rx="1.25" fill="currentColor" opacity="0.82" />
      <rect x="6.25" y="2.5"  width="7"   height="1.5" rx="0.75" fill="currentColor" opacity="0.42" />
      <rect x="6.25" y="5.5"  width="5.5" height="1.5" rx="0.75" fill="currentColor" opacity="0.42" />
      <rect x="6.25" y="8.5"  width="6.5" height="1.5" rx="0.75" fill="currentColor" opacity="0.42" />
    </svg>
  );
}

const SIDEBAR_TRANSITION = { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as const };
const SIDEBAR_EXPANDED  = 248;
const SIDEBAR_COLLAPSED = 72;

export function Layout() {
  const { activePage, navigate, accounts, isCmdOpen, closeCmd, endLaunchSession, markSessionInGame, launchHistory } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const PageComponent = PAGE_COMPONENTS[activePage];

  // Single presence poll shared by Sidebar badges and CommandPalette
  const presenceMap = usePresence(accounts);
  const inGameCount = Object.values(presenceMap).filter(p => p.presenceType === 2).length;

  // Reconcile launch sessions against presence. Runs from the always-mounted
  // Layout (not just the Sessions page) so the "Already Running" guard and the
  // launch history stay correct no matter which page the user is on.
  const prevPresence = useRef<Record<string, number>>({});
  useEffect(() => {
    for (const account of accounts) {
      if (!account.robloxUserId) continue;
      const uid = account.robloxUserId;
      const current = presenceMap[uid]?.presenceType ?? -1;
      const prev = prevPresence.current[uid] ?? -1;
      if (prev !== 2 && current === 2) markSessionInGame(account.id);
      if (prev === 2 && current !== 2) endLaunchSession(account.id);
      prevPresence.current[uid] = current;
    }
  }, [presenceMap, accounts, endLaunchSession, markSessionInGame]);

  // Close phantom launches: records that were recorded but never reached in-game
  // (failed/aborted launches). Without this they'd show "Active" with an
  // ever-growing duration forever. Grace period covers slow game loads.
  useEffect(() => {
    const PHANTOM_MS = 5 * 60 * 1000;
    const sweep = () => {
      const now = Date.now();
      for (const r of launchHistory) {
        if (r.endedAt || r.inGameAt) continue;
        const acct = accounts.find(a => a.id === r.accountId);
        const uid = acct?.robloxUserId;
        const inGame = uid ? presenceMap[uid]?.presenceType === 2 : false;
        if (!inGame && now - new Date(r.startedAt).getTime() > PHANTOM_MS) {
          endLaunchSession(r.accountId);
        }
      }
    };
    const id = setInterval(sweep, 30_000);
    return () => clearInterval(id);
  }, [launchHistory, accounts, presenceMap, endLaunchSession]);

  const btnLeft = (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED) - 13;

  return (
    <div className="flex h-full w-full relative overflow-hidden" style={{ background: 'var(--bg, #0C0C0C)' }}>
      <AmbientBackground />

      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        inGameCount={inGameCount}
        accountCount={accounts.length}
      />

      {/* Sidebar toggle — outside sidebar to avoid overflow:hidden clipping */}
      <motion.button
        onClick={() => setCollapsed(c => !c)}
        animate={{ left: btnLeft }}
        transition={SIDEBAR_TRANSITION}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.90 }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: 19,
          zIndex: 30,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 10px rgba(0,0,0,0.6)',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ scaleX: collapsed ? -1 : 1 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <SidebarPanelIcon />
        </motion.div>
      </motion.button>

      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command palette — rendered here so it has access to shared presenceMap */}
      <CommandPalette
        open={isCmdOpen}
        onClose={closeCmd}
        presenceMap={presenceMap}
      />
    </div>
  );
}
