import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Star, Tag, ImagePlus, Trash2, Loader2, AlignLeft, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { readImageAsAvatar, readImageScaled } from '../../utils/image';

function useEscapeKey(onEscape: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, enabled]);
}

const baseInput: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '10px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
};

const errBorder = '1px solid rgba(239,68,68,0.5)';

export function EditAccountModal() {
  const { accounts, editAccountId, closeEdit, updateAccount, tags, toggleAccountTag, openDescription } = useApp();
  const { toast } = useToast();

  const account = editAccountId != null
    ? accounts.find(a => a.id === editAccountId) ?? null
    : null;

  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [usernameErr, setUsernameErr] = useState('');
  const [imgLoading, setImgLoading] = useState(false);
  const [descImgLoading, setDescImgLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (account) {
      setUsername(account.username);
      // Fall back to any legacy note that hasn't been migrated yet.
      setDescription(account.description ?? account.notes ?? '');
      setFavorite(account.isFavorite);
      setUsernameErr('');
    }
  }, [account]);

  const handleClose = () => { setUsernameErr(''); closeEdit(); };
  useEscapeKey(handleClose, account !== null);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !account) return;
    setImgLoading(true);
    try {
      const dataUrl = await readImageAsAvatar(file);
      updateAccount(account.id, { avatarUrl: dataUrl });
      toast('Account image updated.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load image.', 'error');
    } finally {
      setImgLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (!account) return;
    updateAccount(account.id, { avatarUrl: undefined });
    toast('Account image removed.', 'info');
  };

  const handleSave = () => {
    if (!username.trim()) { setUsernameErr('Username is required.'); return; }
    if (!account) return;
    updateAccount(account.id, {
      username: username.trim(),
      description: description.trim() || undefined,
      notes: undefined, // notes are consolidated into description
      isFavorite: favorite,
    });
    toast(`"${username.trim()}" updated.`, 'success');
    handleClose();
  };

  const handleEmbedImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0 || !account) return;
    setDescImgLoading(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        try { added.push(await readImageScaled(file)); } catch { /* skip bad file */ }
      }
      if (added.length > 0) {
        updateAccount(account.id, { descriptionImages: [...(account.descriptionImages ?? []), ...added] });
        toast(`Embedded ${added.length} image${added.length !== 1 ? 's' : ''}.`, 'success');
      } else {
        toast('No images could be added.', 'error');
      }
    } finally {
      setDescImgLoading(false);
    }
  };

  const handleRemoveDescImage = (idx: number) => {
    if (!account) return;
    const next = (account.descriptionImages ?? []).filter((_, i) => i !== idx);
    updateAccount(account.id, { descriptionImages: next.length > 0 ? next : undefined });
  };

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            onClick={e => e.stopPropagation()}
            className="modal-surface w-full max-w-sm mx-4"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt={account.username}
                    style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40`, flexShrink: 0 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-xl text-xs font-bold flex-shrink-0"
                    style={{
                      width: 36, height: 36,
                      background: `${account.avatarColor}20`,
                      border: `1.5px solid ${account.avatarColor}40`,
                      color: account.avatarColor,
                    }}
                  >
                    {account.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold text-white leading-snug">Account Details</h2>
                  <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>{account.username}</p>
                </div>
              </div>
              <button onClick={handleClose} className="btn-icon" aria-label="Close">
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Account image */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <ImagePlus size={11} strokeWidth={2} /> Account Image
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={account.username}
                      style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}55`, flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-2xl text-base font-bold flex-shrink-0"
                      style={{ width: 56, height: 56, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
                    >
                      {account.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={handlePickImage}
                      disabled={imgLoading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(var(--accent-rgb),0.12)',
                        border: '1px solid rgba(var(--accent-rgb),0.3)',
                        color: 'var(--accent)',
                        cursor: imgLoading ? 'not-allowed' : 'pointer',
                        opacity: imgLoading ? 0.7 : 1,
                        width: 'fit-content',
                      }}
                    >
                      {imgLoading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={2} />}
                      {account.avatarUrl ? 'Change image' : 'Upload image'}
                    </button>
                    {account.avatarUrl && (
                      <button
                        onClick={handleRemoveImage}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', cursor: 'pointer', width: 'fit-content' }}
                      >
                        <Trash2 size={11} strokeWidth={2} /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageSelected}
                />
              </div>

              {/* Username */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <User size={11} strokeWidth={2} /> Username <span style={{ color: '#F87171' }}>*</span>
                </label>
                <input
                  className="input-transition"
                  style={{ ...baseInput, border: usernameErr ? errBorder : baseInput.border }}
                  value={username}
                  onChange={e => { setUsername(e.target.value); if (usernameErr) setUsernameErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
                {usernameErr && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{usernameErr}</p>}
              </div>

              {/* Description (long-form, with embedded images) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <AlignLeft size={11} strokeWidth={2} /> Description
                    <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <button
                    onClick={() => account && openDescription(account.id)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                    title="Open expanded view"
                  >
                    <Maximize2 size={10} strokeWidth={2} /> Expand
                  </button>
                </div>
                <textarea
                  rows={4}
                  className="input-transition"
                  style={{ ...baseInput, resize: 'vertical', minHeight: 84 }}
                  placeholder="Details about this account — purpose, items, history…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                {/* Embedded images */}
                {(account.descriptionImages?.length ?? 0) > 0 && (
                  <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                    {account.descriptionImages!.map((src, i) => (
                      <div key={i} className="relative group" style={{ aspectRatio: '1 / 1' }}>
                        <img src={src} alt={`embed ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <button
                          onClick={() => handleRemoveDescImage(i)}
                          className="absolute flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ top: -6, right: -6, width: 18, height: 18, background: '#EF4444', color: '#fff', border: '2px solid #0D0D0D', cursor: 'pointer' }}
                          title="Remove image"
                        >
                          <X size={9} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => descFileInputRef.current?.click()}
                  disabled={descImgLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg mt-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', cursor: descImgLoading ? 'not-allowed' : 'pointer',
                    opacity: descImgLoading ? 0.7 : 1, width: 'fit-content',
                  }}
                >
                  {descImgLoading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} strokeWidth={2} />}
                  Embed image
                </button>
                <input
                  ref={descFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleEmbedImages}
                />
              </div>

              {/* Favourite toggle */}
              <button
                onClick={() => setFavorite(f => !f)}
                className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl"
                style={{
                  background: favorite ? 'rgba(var(--accent-rgb),0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${favorite ? 'rgba(var(--accent-rgb),0.3)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                  transition: 'background 150ms, border-color 150ms',
                }}
              >
                <Star size={14} strokeWidth={2} fill={favorite ? 'var(--accent)' : 'none'} style={{ color: favorite ? 'var(--accent)' : 'rgba(255,255,255,0.38)' }} />
                <span className="text-sm" style={{ color: favorite ? 'var(--accent)' : 'rgba(255,255,255,0.48)', transition: 'color 150ms' }}>
                  Mark as favourite
                </span>
              </button>

              {/* Tags */}
              {tags.length > 0 && account && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <Tag size={11} strokeWidth={2} /> Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => {
                      const active = account.tags.some(t => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleAccountTag(account.id, tag)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: active ? `${tag.color}20` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${active ? tag.color + '55' : 'rgba(255,255,255,0.09)'}`,
                            color: active ? tag.color : 'rgba(255,255,255,0.38)',
                            cursor: 'pointer',
                            transition: 'background 150ms, border-color 150ms, color 150ms',
                          }}
                        >
                          <Tag size={9} strokeWidth={2} />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleClose} className="btn-cancel flex-1 py-2.5">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                  style={{
                    background: 'rgba(var(--accent-rgb),0.14)',
                    border: '1px solid rgba(var(--accent-rgb),0.35)',
                    color: 'var(--accent)',
                    transition: 'background 150ms, border-color 150ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.22)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.14)'; }}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
