import type { AccountStatus } from '../../types';

interface Props {
  status: AccountStatus;
  showDot?: boolean;
}

const CONFIG: Record<AccountStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: 'Active',    bg: 'rgba(var(--accent-rgb),0.1)',   text: 'var(--accent)', dot: 'var(--accent)' },
  expired:  { label: 'Expired',   bg: 'rgba(239,68,68,0.12)',  text: '#F87171', dot: '#EF4444' },
  disabled: { label: 'Disabled',  bg: 'rgba(100,116,139,0.15)',text: '#94A3B8', dot: '#64748B' },
  banned:   { label: 'Banned',    bg: 'rgba(249,115,22,0.12)', text: '#FB923C', dot: '#F97316' },
};

export function StatusBadge({ status, showDot = true }: Props) {
  const cfg = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {showDot && (
        <span
          className="relative flex h-1.5 w-1.5"
          aria-hidden="true"
        >
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              background: cfg.dot,
              animation: status === 'active' ? 'pulse-ring 1.8s ease-out infinite' : 'none',
            }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ background: cfg.dot }}
          />
        </span>
      )}
      {cfg.label}
    </span>
  );
}
