import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const PALETTE = ['#9EFF00','#0EA5E9','#A855F7','#F97316','#FFB800','#10B981','#EF4444','#EC4899'];

export function Tags() {
  const { accounts, tags, addTag, deleteTag } = useApp();
  const { toast } = useToast();

  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newColor, setNewColor]   = useState(PALETTE[0]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    addTag(name, newColor);
    toast(`Tag "${name}" created.`, 'success');
    setNewName('');
    setNewColor(PALETTE[0]);
    setCreating(false);
  };

  const handleDelete = (id: number, name: string) => {
    deleteTag(id);
    toast(`Tag "${name}" removed.`, 'success');
  };

  return (
    <div className="p-6 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-lg font-bold text-white">Tags</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Label and categorise accounts
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <Plus size={14} /> New Tag
        </motion.button>
      </motion.div>

      {/* Inline create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-col gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input
                autoFocus
                placeholder="Tag name…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                className="px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
              {/* Color picker */}
              <div className="flex items-center gap-2">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="rounded-full flex-shrink-0 transition-transform"
                    style={{
                      width: 22, height: 22,
                      background: c,
                      border: newColor === c ? '2px solid white' : '2px solid transparent',
                      transform: newColor === c ? 'scale(1.25)' : 'scale(1)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleCreate} className="btn-primary py-2">
                  Create
                </motion.button>
                <button
                  onClick={() => { setCreating(false); setNewName(''); }}
                  className="btn-icon"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {tags.map((tag, i) => {
            const members = accounts.filter(a => a.tags.some(t => t.id === tag.id));
            return (
              <motion.div
                key={tag.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group rounded-2xl p-5 relative"
                style={{
                  background: 'rgba(18,18,18,0.90)',
                  border: `1px solid ${tag.color}25`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', cursor: 'pointer' }}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>

                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4"
                  style={{ background: `${tag.color}15`, border: `1px solid ${tag.color}30` }}
                >
                  <Tag size={12} style={{ color: tag.color }} />
                  <span className="text-sm font-bold" style={{ color: tag.color }}>{tag.name}</span>
                </div>
                <div className="text-2xl font-bold text-white">{members.length}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>accounts tagged</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {tags.length === 0 && !creating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
          <Tag size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No tags yet</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Click "New Tag" to create one</p>
        </motion.div>
      )}
    </div>
  );
}
