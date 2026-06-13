import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function ConfirmDialog() {
  const { confirmOptions, closeConfirm } = useApp();
  const open = !!confirmOptions;

  const handleConfirm = () => {
    confirmOptions?.onConfirm();
    closeConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={closeConfirm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{    opacity: 0, scale: 0.94, y: 14  }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm mx-4 modal-surface p-6"
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl mb-4"
              style={{
                background: confirmOptions?.danger !== false
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(var(--accent-rgb),0.1)',
                border: `1px solid ${confirmOptions?.danger !== false
                  ? 'rgba(239,68,68,0.28)'
                  : 'rgba(var(--accent-rgb),0.25)'}`,
              }}
            >
              <AlertTriangle
                size={20}
                strokeWidth={2}
                style={{ color: confirmOptions?.danger !== false ? '#F87171' : 'var(--accent)' }}
              />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
              {confirmOptions?.title}
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.48)' }}>
              {confirmOptions?.message}
            </p>

            <div className="flex items-center gap-3">
              {!confirmOptions?.hideCancel && (
                <button
                  onClick={closeConfirm}
                  className="btn-cancel flex-1 py-2.5"
                >
                  Cancel
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                style={{
                  background: confirmOptions?.danger !== false
                    ? 'rgba(239,68,68,0.16)'
                    : 'rgba(var(--accent-rgb),0.14)',
                  border: `1px solid ${confirmOptions?.danger !== false
                    ? 'rgba(239,68,68,0.38)'
                    : 'rgba(var(--accent-rgb),0.38)'}`,
                  color: confirmOptions?.danger !== false ? '#F87171' : 'var(--accent)',
                  transition: 'background 150ms, border-color 150ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (confirmOptions?.danger !== false) {
                    el.style.background = 'rgba(239,68,68,0.24)';
                  } else {
                    el.style.background = 'rgba(var(--accent-rgb),0.22)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (confirmOptions?.danger !== false) {
                    el.style.background = 'rgba(239,68,68,0.16)';
                  } else {
                    el.style.background = 'rgba(var(--accent-rgb),0.14)';
                  }
                }}
              >
                {confirmOptions?.confirmLabel ?? 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
