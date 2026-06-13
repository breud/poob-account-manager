import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  position: { top: number; left: number } | null;
  children: ReactNode;
  minWidth?: number;
}

export function DropdownPortal({ open, onClose, position, children, minWidth = 160 }: Props) {
  return createPortal(
    <AnimatePresence>
      {open && position && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
            onMouseDown={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 9999,
              borderRadius: 14,
              overflow: 'hidden',
              background: 'rgba(12,12,12,0.99)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)',
              minWidth,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
