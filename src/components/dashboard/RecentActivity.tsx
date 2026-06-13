import { motion } from 'framer-motion';
import { Play, ShieldCheck, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RECENT_EVENTS } from '../../data/mockData';
import type { ActivityEvent } from '../../types';

const EVENT_CONFIG: Record<
  ActivityEvent['type'],
  { label: string; Icon: LucideIcon; color: string }
> = {
  launch:  { label: 'Launched',       Icon: Play,         color: 'var(--accent)' },
  validate:{ label: 'Validated',       Icon: ShieldCheck,  color: '#0EA5E9' },
  add:     { label: 'Added',           Icon: UserPlus,     color: '#A855F7' },
  expired: { label: 'Cookie Expired',  Icon: AlertTriangle,color: '#EF4444' },
  refresh: { label: 'Profile Refresh', Icon: RefreshCw,    color: '#F97316' },
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(18,18,18,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <h3 className="text-sm font-semibold text-white mb-1">Recent Activity</h3>
      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Latest account events</p>

      <div className="space-y-0">
        {RECENT_EVENTS.map((event, i) => {
          const cfg = EVENT_CONFIG[event.type];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.06, duration: 0.3 }}
              className="flex items-start gap-3 py-2.5"
              style={{
                borderBottom: i < RECENT_EVENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                style={{
                  width: 30,
                  height: 30,
                  background: `${cfg.color}15`,
                  border: `1px solid ${cfg.color}25`,
                }}
              >
                <cfg.Icon
                  size={13}
                  strokeWidth={2}
                  style={{ color: cfg.color }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-white truncate">
                    {event.accountUsername}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {event.timestamp}
                  </span>
                  <span
                    className="text-xs px-1.5 py-px rounded-md font-medium"
                    style={{
                      background: event.success ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(239,68,68,0.1)',
                      color: event.success ? 'var(--accent)' : '#F87171',
                    }}
                  >
                    {event.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
