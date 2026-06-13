import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '../ui/AnimatedCounter';

interface Props {
  title: string;
  value: number;
  suffix?: string;
  change?: string;
  changePositive?: boolean;
  Icon: LucideIcon;
  accentColor?: string;
  delay?: number;
  subtext?: string;
}

export function StatsCard({
  title,
  value,
  suffix = '',
  change,
  changePositive = true,
  Icon,
  accentColor = 'var(--accent)',
  delay = 0,
  subtext,
}: Props) {
  const isGreen = accentColor === 'var(--accent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="relative overflow-hidden rounded-2xl p-5 cursor-default"
      style={{
        background: 'rgba(18,18,18,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}33`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${accentColor}15`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${accentColor}08 0%, transparent 70%)`,
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {title}
          </p>
          {change && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-lg"
              style={{
                background: changePositive ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(239,68,68,0.1)',
                color: changePositive ? 'var(--accent)' : '#F87171',
              }}
            >
              {change}
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <Icon size={18} strokeWidth={2} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Number */}
      <div
        className="flex items-end gap-1 text-3xl font-bold tabular-nums"
        style={{ color: isGreen ? 'var(--accent)' : 'white' }}
      >
        <AnimatedCounter
          value={value}
          suffix={suffix}
          delay={delay * 1000 + 200}
        />
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {subtext}
        </p>
      )}

      {/* Bottom accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
        style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }}
      />
    </motion.div>
  );
}
