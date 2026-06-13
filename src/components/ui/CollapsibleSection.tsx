import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Extra header content (counts, action buttons). Clicks inside should stopPropagation. */
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

// A card whose body collapses/expands when its header is clicked. Used to keep
// long lists (launch history, stats) from dominating the page.
export function CollapsibleSection({
  title, subtitle, icon, right, defaultOpen = true, children, style,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(18,18,18,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        ...style,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-3 w-full px-5 py-4 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 150ms' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle && (
            <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</div>
          )}
        </div>
        {right && <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>{right}</div>}
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
