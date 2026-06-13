import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import type { AccountStatus } from '../../types';

const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string }> = {
  active:   { label: 'Active',   color: 'var(--accent)' },
  expired:  { label: 'Expired',  color: '#EF4444' },
  disabled: { label: 'Disabled', color: '#64748B' },
  banned:   { label: 'Banned',   color: '#F97316' },
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: 'rgba(14,14,14,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-white font-semibold">{item.name}: {item.value}</span>
      </div>
    </div>
  );
}

export function StatusDonut() {
  const { accounts } = useApp();

  const counts = accounts.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const data = (Object.entries(STATUS_CONFIG) as [AccountStatus, { label: string; color: string }][])
    .filter(([key]) => counts[key] > 0)
    .map(([key, { label, color }]) => ({
      name: label,
      value: counts[key] || 0,
      color,
      status: key,
    }));

  const total = accounts.length;
  const activeCount = counts['active'] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(18,18,18,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <h3 className="text-sm font-semibold text-white mb-1">Account Status</h3>
      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Distribution across all accounts
      </p>

      <div className="relative" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          aria-label={`${activeCount} of ${total} accounts active`}
        >
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{activeCount}</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Active</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {data.map(item => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-1 rounded-full"
                style={{
                  width: total > 0 ? Math.round((item.value / total) * 60) : 0,
                  background: item.color,
                  opacity: 0.6,
                }}
              />
              <span className="text-xs font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.7)', minWidth: 16, textAlign: 'right' }}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
