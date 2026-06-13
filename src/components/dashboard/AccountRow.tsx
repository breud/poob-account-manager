import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ShieldCheck, MoreHorizontal, Star, Trash2, Pencil, Tag } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { DropdownPortal } from '../ui/DropdownPortal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import type { Account } from '../../types';

interface Props {
  account: Account;
  index: number;
}

export function AccountRow({ account, index }: Props) {
  const { deleteAccount, showConfirm, openLaunch, openEdit, tags, toggleAccountTag } = useApp();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagPos, setTagPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tagBtnRef = useRef<HTMLButtonElement>(null);
  const initials = account.username.slice(0, 2).toUpperCase();

  const handleMoreClick = () => {
    if (menuOpen) { setMenuOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.right - 160 });
    }
    setMenuOpen(true);
  };

  const handleTagClick = () => {
    if (tagOpen) { setTagOpen(false); return; }
    if (tagBtnRef.current) {
      const r = tagBtnRef.current.getBoundingClientRect();
      setTagPos({ top: r.bottom + 4, left: r.right - 180 });
    }
    setTagOpen(true);
  };

  const handleValidate = async () => {
    toast(`Validating cookie for ${account.username}…`, 'info');
    await new Promise(r => setTimeout(r, 900));
    toast(
      account.status === 'active'
        ? `${account.username}: cookie is valid.`
        : `${account.username}: cookie is expired or invalid.`,
      account.status === 'active' ? 'success' : 'error',
    );
  };

  const handleDelete = () => {
    setMenuOpen(false);
    showConfirm({
      title: 'Delete Account',
      message: `Remove "${account.username}" from the manager? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        deleteAccount(account.id);
        toast(`"${account.username}" removed.`, 'success');
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
      className="group flex items-center gap-3 px-4 rounded-xl cursor-default"
      style={{ transition: 'background 200ms', paddingTop: theme.compactMode ? 6 : 12, paddingBottom: theme.compactMode ? 6 : 12 }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt={account.username}
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40` }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl text-xs font-bold"
            style={{ width: 38, height: 38, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
          >
            {initials}
          </div>
        )}
        {account.isFavorite && (
          <div
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
            style={{ width: 14, height: 14, background: '#FFB800', boxShadow: '0 0 6px rgba(255,184,0,0.5)' }}
          >
            <Star size={8} fill="#0C0C0C" strokeWidth={0} />
          </div>
        )}
      </div>

      {/* Username + notes */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{account.username}</span>
          {account.displayName && (
            <span className="text-xs truncate hidden sm:block" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {account.displayName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {account.groups.slice(0, 2).map(g => (
            <span key={g.id} className="text-xs px-1.5 py-px rounded-md font-medium" style={{ background: `${g.color}18`, color: g.color }}>
              {g.name}
            </span>
          ))}
          {account.notes && (
            <span className="text-xs truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {account.notes}
            </span>
          )}
          {!account.notes && account.lastUsedAt && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{account.lastUsedAt}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 hidden md:block">
        <StatusBadge status={account.status} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
        {/* Launch */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => openLaunch(account.id)}
          disabled={account.status !== 'active'}
          aria-label={`Launch ${account.username}`}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{
            background: account.status === 'active' ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(255,255,255,0.04)',
            color: account.status === 'active' ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
            border: `1px solid ${account.status === 'active' ? 'rgba(var(--accent-rgb),0.2)' : 'rgba(255,255,255,0.06)'}`,
            cursor: account.status === 'active' ? 'pointer' : 'not-allowed',
          }}
        >
          <Play size={12} strokeWidth={2.5} fill={account.status === 'active' ? 'var(--accent)' : 'rgba(255,255,255,0.2)'} />
        </motion.button>

        {/* Validate */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleValidate}
          aria-label={`Validate ${account.username}`}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.2)', cursor: 'pointer' }}
        >
          <ShieldCheck size={12} strokeWidth={2} />
        </motion.button>

        {/* Quick tag */}
        <motion.button
          ref={tagBtnRef}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleTagClick}
          aria-label={`Tag ${account.username}`}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{
            background: tagOpen ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
            color: tagOpen ? '#A855F7' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${tagOpen ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer',
          }}
        >
          <Tag size={12} strokeWidth={2} />
        </motion.button>

        {/* More menu */}
        <motion.button
          ref={btnRef}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMoreClick}
          aria-label={`More options for ${account.username}`}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{
            background: menuOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={13} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Quick tag popover */}
      <DropdownPortal open={tagOpen} onClose={() => setTagOpen(false)} position={tagPos}>
        <div className="px-3 pt-2.5 pb-1">
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Tags</p>
          {tags.length === 0 ? (
            <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>No tags yet — create one in Tags.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {tags.map(tag => {
                const active = account.tags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleAccountTag(account.id, tag)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors"
                    style={{
                      background: active ? `${tag.color}18` : 'transparent',
                      border: `1px solid ${active ? tag.color + '40' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                    <span className="text-xs font-medium" style={{ color: active ? tag.color : 'rgba(255,255,255,0.6)' }}>
                      {tag.name}
                    </span>
                    {active && <span className="ml-auto text-xs" style={{ color: tag.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DropdownPortal>

      <DropdownPortal open={menuOpen} onClose={() => setMenuOpen(false)} position={menuPos}>
        <button
          onClick={() => { setMenuOpen(false); openEdit(account.id); }}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
          style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Pencil size={13} strokeWidth={2} /> Edit Account
        </button>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <button
          onClick={handleDelete}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left"
          style={{ color: '#F87171', cursor: 'pointer', background: 'transparent' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Trash2 size={13} strokeWidth={2} /> Delete Account
        </button>
      </DropdownPortal>
    </motion.div>
  );
}
