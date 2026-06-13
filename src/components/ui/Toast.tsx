import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, type ToastType } from '../../context/ToastContext';

const CFG: Record<ToastType, { Icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { Icon: CheckCircle2,  color: 'var(--accent)', bg: 'rgba(var(--accent-rgb),0.09)',  border: 'rgba(var(--accent-rgb),0.28)'  },
  error:   { Icon: XCircle,       color: '#F87171', bg: 'rgba(239,68,68,0.09)',  border: 'rgba(239,68,68,0.28)'  },
  warning: { Icon: AlertTriangle, color: '#FBB040', bg: 'rgba(251,176,64,0.09)', border: 'rgba(251,176,64,0.28)' },
  info:    { Icon: Info,          color: '#38BDF8', bg: 'rgba(56,189,248,0.09)', border: 'rgba(56,189,248,0.28)' },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map(t => {
          const { Icon, color, bg, border } = CFG[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 52, scale: 0.94 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 52, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto max-w-sm"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset',
                minWidth: 240,
              }}
            >
              <Icon size={15} style={{ color, flexShrink: 0 }} strokeWidth={2.2} />
              <span
                className="text-sm flex-1 leading-snug"
                style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.008em' }}
              >
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  transition: 'color 150ms, background 150ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'rgba(255,255,255,0.75)';
                  el.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'rgba(255,255,255,0.3)';
                  el.style.background = 'transparent';
                }}
                aria-label="Dismiss"
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
