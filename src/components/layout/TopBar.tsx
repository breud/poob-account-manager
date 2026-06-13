import { motion } from 'framer-motion';
import { Bell, Plus, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { Page } from '../../types';


const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of all your accounts' },
  accounts:  { title: 'Accounts',  subtitle: 'Manage and monitor all accounts' },
  sessions:  { title: 'Sessions',  subtitle: 'Active and recent game sessions' },
  tags:        { title: 'Tags',        subtitle: 'Label and categorize accounts' },
  statistics:  { title: 'Statistics',  subtitle: 'Playtime, usage trends, and activity' },
  settings:    { title: 'Settings',    subtitle: 'App configuration and preferences' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function TopBar() {
  const { activePage, openAddAccount, openCmd } = useApp();
  const { toast } = useToast();
  const { title, subtitle } = PAGE_TITLES[activePage];

  return (
    <header
      className="flex items-center justify-between flex-shrink-0 px-6"
      style={{
        height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(14,14,14,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: page title */}
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-base font-bold text-white leading-tight">{title}</h1>
        <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {activePage === 'dashboard' ? getGreeting() : subtitle}
        </p>
      </motion.div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.07)' }}
          whileTap={{ scale: 0.97 }}
          onClick={openCmd}
          aria-label="Open command palette (Ctrl+K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px 6px 10px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <Search size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>Search</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginLeft: 4,
              padding: '1px 5px',
              borderRadius: 5,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.02em',
            }}
          >
            ⌃K
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, rotate: 180 }}
          transition={{ rotate: { duration: 0.4 } }}
          onClick={() => toast('Data refreshed.', 'success')}
          className="btn-icon"
          aria-label="Refresh"
        >
          <RefreshCw size={15} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast('No new notifications.', 'info')}
          className="btn-icon"
          aria-label="Notifications"
        >
          <Bell size={15} strokeWidth={2} />
        </motion.button>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={openAddAccount}
          className="btn-primary"
          aria-label="Add new account"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Account</span>
        </motion.button>
      </div>
    </header>
  );
}
