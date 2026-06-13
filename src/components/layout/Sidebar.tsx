import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Monitor,
  Tag, Settings, Shield, BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  inGameCount: number;
  accountCount: number;
}

const NAV_ITEMS: { page: Page; label: string; Icon: LucideIcon }[] = [
  { page: 'dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { page: 'accounts',    label: 'Accounts',    Icon: Users           },
  { page: 'sessions',    label: 'Sessions',    Icon: Monitor         },
  { page: 'tags',        label: 'Tags',        Icon: Tag             },
  { page: 'statistics',  label: 'Statistics',  Icon: BarChart3       },
];

const BOTTOM_ITEMS: { page: Page; label: string; Icon: LucideIcon }[] = [
  { page: 'settings', label: 'Settings', Icon: Settings },
];

export function Sidebar({ activePage, onNavigate, collapsed, inGameCount, accountCount }: Props) {
  const { theme } = useTheme();
  const glowMode = theme.glowMode;
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col h-full flex-shrink-0"
      style={{
        background: '#0E0E0E',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-16 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 38, height: 38,
            background: 'rgba(var(--accent-rgb),0.10)',
            border: '1px solid rgba(var(--accent-rgb),0.22)',
            boxShadow: glowMode
              ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px rgba(var(--accent-rgb),0.18)'
              : 'inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <Shield size={18} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <div className="text-sm font-bold text-white leading-tight">Poob Roblox</div>
              <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Account Manager</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="px-2 pb-2 pt-1"
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                Navigation
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map(({ page, label, Icon }) => {
          const isActive = activePage === page;
          return (
            <motion.button
              key={page}
              onClick={() => onNavigate(page)}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              title={collapsed ? label : undefined}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="w-full"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 12,
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(var(--accent-rgb),0.10)' : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : 'none',
                transition: 'background 200ms, color 200ms, box-shadow 200ms',
                cursor: 'pointer',
                border: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              <span style={{ filter: isActive && glowMode ? 'drop-shadow(0 0 6px rgba(var(--accent-rgb),0.5))' : 'none', flexShrink: 0 }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </span>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Live badges */}
              <AnimatePresence>
                {!collapsed && (
                  <>
                    {page === 'accounts' && accountCount > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.18 }}
                        className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.4 }}
                      >
                        {accountCount}
                      </motion.span>
                    )}
                    {page === 'sessions' && inGameCount > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.18 }}
                        className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E', fontSize: 10, lineHeight: 1.4, boxShadow: '0 0 6px rgba(34,197,94,0.3)' }}
                      >
                        {inGameCount}
                      </motion.span>
                    )}
                  </>
                )}
              </AnimatePresence>

              {/* Collapsed in-game dot badge */}
              {collapsed && page === 'sessions' && inGameCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8, right: 8,
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: '#22C55E',
                    boxShadow: '0 0 5px rgba(34,197,94,0.7)',
                  }}
                />
              )}
            </motion.button>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 8px' }} />

        {BOTTOM_ITEMS.map(({ page, label, Icon }) => {
          const isActive = activePage === page;
          return (
            <motion.button
              key={page}
              onClick={() => onNavigate(page)}
              whileTap={{ scale: 0.97 }}
              title={collapsed ? label : undefined}
              aria-label={label}
              className="w-full"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 12,
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(var(--accent-rgb),0.10)' : 'transparent',
                transition: 'background 200ms, color 200ms',
                cursor: 'pointer',
                border: 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              <Icon size={18} strokeWidth={2} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

    </motion.aside>
  );
}
