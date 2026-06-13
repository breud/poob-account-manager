import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

// Read-only expanded view of an account's full description, including any
// embedded images. Opened from the details modal and the account menus.
export function DescriptionModal() {
  const { accounts, descriptionAccountId, closeDescription, openEdit } = useApp();
  const { hideNotes } = useTheme();

  const account = descriptionAccountId != null
    ? accounts.find(a => a.id === descriptionAccountId) ?? null
    : null;

  useEffect(() => {
    if (!account) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDescription(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [account, closeDescription]);

  const images = account?.descriptionImages ?? [];
  const text = account?.description?.trim() ?? '';
  const hasContent = text.length > 0 || images.length > 0;

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={closeDescription}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            onClick={e => e.stopPropagation()}
            className="modal-surface w-full max-w-lg mx-4 flex flex-col"
            style={{ maxHeight: '82vh' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt={account.username}
                    style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40`, flexShrink: 0 }} />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-xl text-xs font-bold flex-shrink-0"
                    style={{ width: 36, height: 36, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
                  >
                    {account.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white leading-snug truncate">Description</h2>
                  <p className="text-xs leading-snug truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{account.username}</p>
                </div>
              </div>
              <button onClick={closeDescription} className="btn-icon" aria-label="Close">
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-5 overflow-y-auto" style={{ flex: 1 }}>
              {!hasContent ? (
                <div className="py-12 text-center">
                  <FileText size={26} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No description yet</p>
                  <button
                    onClick={() => { closeDescription(); openEdit(account.id); }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.3)', color: 'var(--accent)', cursor: 'pointer' }}
                  >
                    <Pencil size={11} strokeWidth={2} /> Add a description
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {text && (
                    <p
                      className="text-sm"
                      style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {hideNotes ? '•'.repeat(Math.min(text.length, 120)) : text}
                    </p>
                  )}
                  {images.length > 0 && (
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                      {images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`description ${i + 1}`}
                          style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', objectFit: 'cover', display: 'block' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { closeDescription(); openEdit(account.id); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              >
                <Pencil size={12} strokeWidth={2} /> Edit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
