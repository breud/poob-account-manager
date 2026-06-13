import { useState, useEffect, type ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/ui/Toast';
import { LockScreen } from './components/ui/LockScreen';
import { AddAccountModal } from './components/modals/AddAccountModal';
import { EditAccountModal } from './components/modals/EditAccountModal';
import { LaunchModal } from './components/modals/LaunchModal';
import { DescriptionModal } from './components/modals/DescriptionModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import type { Page } from './types';

const PAGES: Page[] = ['dashboard', 'accounts', 'sessions', 'tags', 'statistics', 'settings'];

// ── Lock gate ─────────────────────────────────────────────────────────────────
// Shown before AppProvider mounts — only needs ThemeProvider and ToastProvider.

function LockGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'locked' | 'unlocked'>('loading');

  useEffect(() => {
    if (!window.electronAPI?.getPasswordSettings) { setState('unlocked'); return; }
    window.electronAPI.getPasswordSettings()
      .then(({ enabled, hasPassword }) => setState(enabled && hasPassword ? 'locked' : 'unlocked'))
      .catch(() => setState('unlocked'));
  }, []);

  if (state === 'loading') {
    return <div style={{ position: 'fixed', inset: 0, background: 'var(--bg, #0C0C0C)' }} />;
  }
  if (state === 'locked') {
    return <LockScreen onUnlock={() => setState('unlocked')} />;
  }
  return <>{children}</>;
}

// ── Roblox detection ──────────────────────────────────────────────────────────
// Runs once after the app is unlocked and loaded.

function RobloxDetect() {
  const { toast } = useToast();
  useEffect(() => {
    window.electronAPI?.checkRobloxRunning?.()
      .then(running => {
        if (running) {
          toast(
            'Roblox is currently open. Close all Roblox windows before using Multi-Instance, or launches may fail.',
            'warning',
          );
        }
      })
      .catch(() => {});
  }, []);
  return null;
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function KeyboardShortcuts() {
  const { openCmd, navigate } = useApp();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'k') {
        e.preventDefault();
        openCmd();
        return;
      }

      if (ctrl && e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key, 10) - 1;
        const page = PAGES[idx];
        if (page) { e.preventDefault(); navigate(page); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCmd, navigate]);

  return null;
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LockGate>
          <AppProvider>
            <RobloxDetect />
            <KeyboardShortcuts />
            <Layout />
            <AddAccountModal />
            <EditAccountModal />
            <LaunchModal />
            <DescriptionModal />
            <ConfirmDialog />
            <ToastContainer />
          </AppProvider>
        </LockGate>
      </ToastProvider>
    </ThemeProvider>
  );
}
