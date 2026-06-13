import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Database, Bell, Download, Upload, Trash2, RotateCcw, ChevronDown, Check, FileText, Layers, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme, FONTS, FONT_CATEGORIES, PRESETS, loadGoogleFont } from '../context/ThemeContext';
import { DropdownPortal } from '../components/ui/DropdownPortal';

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative flex-shrink-0 rounded-full"
      style={{
        width: 44, height: 24,
        background: checked ? 'var(--accent, #9B77FF)' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? 'var(--accent, #9B77FF)' : 'rgba(255,255,255,0.15)'}`,
        cursor: 'pointer',
        boxShadow: checked ? '0 0 12px rgba(var(--accent-rgb, 155,119,255), 0.3)' : 'none',
        transition: 'background 200ms, box-shadow 200ms',
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0.5 rounded-full"
        style={{ width: 18, height: 18, background: checked ? 'var(--bg, #0C0C0C)' : 'rgba(255,255,255,0.6)' }}
      />
    </button>
  );
}

// ── ColorRow ──────────────────────────────────────────────────────────────────

function ColorRow({ label, desc, color, onChange }: { label: string; desc: string; color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(color);

  useEffect(() => setHex(color), [color]);

  const handleChange = (c: string) => { setHex(c); onChange(c); };
  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHex(v);
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v);
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-4 w-full px-5 py-4 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 28, height: 28, borderRadius: 8, background: color, border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0, boxShadow: `0 0 10px ${color}60` }} />
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>{color.toUpperCase()}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <HexColorPicker color={hex} onChange={handleChange} style={{ width: '100%' }} />
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={hex}
                    onChange={handleHexInput}
                    maxLength={7}
                    spellCheck={false}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-mono text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="#000000"
                  />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: hex, border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0, boxShadow: `0 0 12px ${hex}60` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── FontDropdown ──────────────────────────────────────────────────────────────

function FontDropdown({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [dropWidth, setDropWidth] = useState(320);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = FONTS.find(f => f.id === value) ?? FONTS[0];

  const handleOpen = () => {
    // Preload all Google Fonts for the dropdown preview
    FONTS.forEach(f => { if (f.googleFamily) loadGoogleFont(f.googleFamily, f.googleWeights); });
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
      setDropWidth(r.width);
    }
    setOpen(true);
  };

  const handleSelect = (id: string) => { onChange(id); setOpen(false); };

  const grouped = Object.entries(FONT_CATEGORIES).map(([cat, label]) => ({
    cat, label,
    fonts: FONTS.filter(f => f.category === cat),
  }));

  return (
    <>
      <button
        ref={btnRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          cursor: 'pointer',
          fontFamily: current.css,
        }}
      >
        <span>{current.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </motion.div>
      </button>

      <DropdownPortal open={open} onClose={() => setOpen(false)} position={pos} minWidth={dropWidth}>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {grouped.map(({ cat, label, fonts }) => fonts.length === 0 ? null : (
            <div key={cat}>
              <div
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider sticky top-0 flex items-center justify-between"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(10,18,35,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span>{label}</span>
                <span style={{ fontWeight: 500, opacity: 0.5 }}>{fonts.length}</span>
              </div>
              {fonts.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleSelect(f.id)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left"
                  style={{
                    background: value === f.id ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
                    color: value === f.id ? 'var(--accent, #9B77FF)' : 'rgba(255,255,255,0.75)',
                    cursor: 'pointer',
                    fontFamily: f.css,
                  }}
                  onMouseEnter={e => { if (value !== f.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = value === f.id ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent'; }}
                >
                  <span>{f.label}</span>
                  {value === f.id && <Check size={13} style={{ flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </DropdownPortal>
    </>
  );
}

// ── Settings page ─────────────────────────────────────────────────────────────

export function Settings() {
  const { accounts, importAccounts, showConfirm, clearAllData } = useApp();
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { theme, setAccent, setBgColor, setFontId, setCompactMode, setGlowMode, applyPreset, resetTheme, hideUsernames, setHideUsernames, hideNotes, setHideNotes } = useTheme();

  const [notifyToggles, setNotifyToggles] = useState({ notifyCookieExpired: true, notifySessionEnd: false, notifyNewLogin: true });
  const [animations, setAnimations] = useState(true);
  const [multiInstance, setMultiInstance] = useState(false);
  const [pwEnabled, setPwEnabled]   = useState(false);
  const [pwAction, setPwAction]     = useState<null | 'enable' | 'disable' | 'change'>(null);
  const [pwField1, setPwField1]     = useState('');
  const [pwField2, setPwField2]     = useState('');
  const [pwShowF1, setPwShowF1]     = useState(false);
  const [pwShowF2, setPwShowF2]     = useState(false);
  const [pwError, setPwError]       = useState('');
  const [pwLoading, setPwLoading]   = useState(false);

  useEffect(() => {
    window.electronAPI?.getMultiInstance?.().then(v => setMultiInstance(v ?? false)).catch(() => {});
    window.electronAPI?.getPasswordSettings?.().then(({ enabled }) => setPwEnabled(enabled)).catch(() => {});
  }, []);

  const cancelPwAction = () => { setPwAction(null); setPwField1(''); setPwField2(''); setPwError(''); };

  const handlePwToggle = () => {
    if (!pwEnabled) {
      setPwAction('enable');
      setPwField1(''); setPwField2(''); setPwError('');
    } else {
      setPwAction('disable');
      setPwField1(''); setPwError('');
    }
  };

  const handlePwSave = async () => {
    if (pwAction === 'enable' || pwAction === 'change') {
      if (!pwField1) { setPwError('Enter a password.'); return; }
      if (pwField1 !== pwField2) { setPwError('Passwords do not match.'); return; }
      setPwLoading(true);
      await window.electronAPI?.setPassword?.(pwField1);
      await window.electronAPI?.setPasswordEnabled?.(true);
      setPwEnabled(true);
      setPwLoading(false);
      cancelPwAction();
      toast(pwAction === 'enable' ? 'Password protection enabled.' : 'Password changed.', 'success');
    } else if (pwAction === 'disable') {
      if (!pwField1) { setPwError('Enter your current password.'); return; }
      setPwLoading(true);
      const ok = await window.electronAPI?.verifyPassword?.(pwField1) ?? true;
      if (!ok) { setPwLoading(false); setPwError('Incorrect password.'); return; }
      await window.electronAPI?.setPasswordEnabled?.(false);
      setPwEnabled(false);
      setPwLoading(false);
      cancelPwAction();
      toast('Password protection disabled.', 'info');
    }
  };

  const handleMultiInstanceToggle = () => {
    if (!multiInstance) {
      showConfirm({
        title: 'Enable Multi-Instance',
        message: 'All Roblox windows must be fully closed before enabling Multi-Instance. Close Roblox now, then click Enable.',
        confirmLabel: 'Enable',
        onConfirm: async () => {
          const result = await window.electronAPI?.setMultiInstance?.(true);
          setMultiInstance(result ?? true);
          toast('Multi-Instance enabled — you can now launch multiple accounts at once.', 'success');
        },
      });
    } else {
      window.electronAPI?.setMultiInstance?.(false).then(result => {
        setMultiInstance(result ?? false);
        toast('Multi-Instance disabled.', 'info');
      });
    }
  };

  const flipNotify = (k: keyof typeof notifyToggles) => setNotifyToggles(p => ({ ...p, [k]: !p[k] }));

  const handleExport = () => {
    // Export all fields (rawCookie included — this file is sensitive, store securely)
    const exportable = accounts.map(({ rawCookie, ...rest }) => ({ ...rest, rawCookie }));
    const data = JSON.stringify(exportable, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ram-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${accounts.length} account${accounts.length !== 1 ? 's' : ''}.`, 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const list = Array.isArray(parsed) ? parsed : [];
        const added = importAccounts(list);
        if (added > 0) toast(`Imported ${added} new account${added !== 1 ? 's' : ''}.`, 'success');
        else toast('No new accounts to import (all already exist).', 'info');
      } catch {
        toast('Failed to parse import file — ensure it is a valid JSON backup.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleClearAll = () => {
    showConfirm({
      title: 'Clear All Data',
      message: 'This will remove all accounts and settings. This action cannot be undone.',
      confirmLabel: 'Clear Everything',
      danger: true,
      onConfirm: () => { clearAllData(); toast('All data cleared.', 'success'); },
    });
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Application configuration and preferences</p>
      </motion.div>

      {/* ── Theme ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="rounded-2xl"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <Palette size={16} style={{ color: '#A855F7' }} />
          </div>
          <span className="flex-1 text-sm font-semibold text-white">Theme</span>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { resetTheme(); toast('Theme reset to defaults.', 'success'); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
          >
            <RotateCcw size={11} strokeWidth={2} /> Reset
          </motion.button>
        </div>

        {/* Presets */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Presets</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => {
              const isActive = theme.accent === p.accent && theme.bgColor === p.bgColor;
              return (
                <motion.button
                  key={p.name}
                  whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => applyPreset(p)}
                  style={{
                    background: p.bgColor,
                    border: `2px solid ${isActive ? p.accent : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 8,
                    boxShadow: isActive ? `0 0 18px ${p.accent}40` : 'none',
                    transition: 'border-color 200ms, box-shadow 200ms',
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: p.accent, boxShadow: `0 0 8px ${p.accent}80` }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? p.accent : 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>{p.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Color pickers */}
        <div className="mt-2">
          <ColorRow label="Accent Color"     desc="Buttons, active states, highlights" color={theme.accent}  onChange={setAccent}  />
          <ColorRow label="Background Color" desc="App background and surfaces"         color={theme.bgColor} onChange={setBgColor} />
        </div>

        {/* Font */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium text-white">Font</div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {FONTS.length} fonts
            </span>
          </div>
          <div className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Interface typeface across 7 categories — Google Fonts loaded on demand</div>
          <FontDropdown value={theme.fontId} onChange={setFontId} />
          {/* Live font preview */}
          {(() => {
            const fontOpt = FONTS.find(f => f.id === theme.fontId) ?? FONTS[0];
            return (
              <div
                className="mt-3 p-4 rounded-xl"
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: fontOpt.css,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    Aa Bb Cc
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    }}
                  >
                    {FONT_CATEGORIES[fontOpt.category]}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginTop: 4 }}>
                  The quick brown fox jumps over the lazy dog — 0123456789
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {(['300','400','500','600','700'] as const).map(w => (
                    <span key={w} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: Number(w) }}>
                      {w === '300' ? 'Light' : w === '400' ? 'Regular' : w === '500' ? 'Medium' : w === '600' ? 'Semi' : 'Bold'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

      </motion.div>

      {/* ── Appearance ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
            <Palette size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-semibold text-white">Appearance</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Interface animations</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Smooth transitions and micro-interactions</div>
            </div>
            <Toggle checked={animations} onChange={() => setAnimations(v => !v)} label="Animations" />
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Compact mode</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Reduce row padding for more accounts per view</div>
            </div>
            <Toggle checked={theme.compactMode} onChange={() => setCompactMode(!theme.compactMode)} label="Compact mode" />
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Effect style</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {theme.glowMode ? 'Neon / Glowy — vivid glow and bloom effects' : 'Smooth / Matte — clean and minimal, no glow'}
              </div>
            </div>
            <Toggle checked={theme.glowMode} onChange={() => setGlowMode(!theme.glowMode)} label="Effect style" />
          </div>
        </div>
      </motion.div>

      {/* ── Launch ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
            <Layers size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-semibold text-white">Launch</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-white">Multi-Instance</div>
              {multiInstance && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.25)' }}
                >
                  Active
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Allow multiple Roblox instances to run at the same time
            </div>
          </div>
          <Toggle checked={multiInstance} onChange={handleMultiInstanceToggle} label="Multi-Instance" />
        </div>
      </motion.div>

      {/* ── Security ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Lock size={16} style={{ color: '#F87171' }} />
          </div>
          <span className="text-sm font-semibold text-white">Security</span>
        </div>

        {/* Password toggle row */}
        <div style={{ borderBottom: pwEnabled ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-white">Password protection</div>
                {pwEnabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    On
                  </span>
                )}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Require a password when the app opens
              </div>
            </div>
            <Toggle checked={pwEnabled} onChange={handlePwToggle} label="Password protection" />
          </div>

          {/* Inline panel */}
          <AnimatePresence>
            {pwAction !== null && (
              <motion.div
                key={pwAction}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
                  <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {pwAction === 'enable'  ? 'Set a password' :
                     pwAction === 'change'  ? 'Change password' :
                     'Enter current password to disable'}
                  </p>
                  {/* Field 1 */}
                  <div className="relative">
                    <input
                      type={pwShowF1 ? 'text' : 'password'}
                      value={pwField1}
                      onChange={e => { setPwField1(e.target.value); setPwError(''); }}
                      placeholder={pwAction === 'disable' ? 'Current password' : 'New password'}
                      className="input-transition"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${pwError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10, padding: '9px 36px 9px 12px', color: 'white', fontSize: 13, outline: 'none',
                      }}
                    />
                    <button onClick={() => setPwShowF1(v => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                      {pwShowF1 ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {/* Field 2 (confirm) — only for enable/change */}
                  {pwAction !== 'disable' && (
                    <div className="relative">
                      <input
                        type={pwShowF2 ? 'text' : 'password'}
                        value={pwField2}
                        onChange={e => { setPwField2(e.target.value); setPwError(''); }}
                        placeholder="Confirm password"
                        className="input-transition"
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${pwError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 10, padding: '9px 36px 9px 12px', color: 'white', fontSize: 13, outline: 'none',
                        }}
                      />
                      <button onClick={() => setPwShowF2(v => !v)} tabIndex={-1}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                        {pwShowF2 ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  )}
                  {pwError && <p className="text-xs" style={{ color: '#F87171' }}>{pwError}</p>}
                  <div className="flex gap-2">
                    <button onClick={cancelPwAction} className="btn-cancel flex-1 py-2">Cancel</button>
                    <motion.button
                      whileHover={{ scale: pwLoading ? 1 : 1.02 }} whileTap={{ scale: pwLoading ? 1 : 0.97 }}
                      onClick={handlePwSave} disabled={pwLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
                      style={{
                        background: pwAction === 'disable' ? 'rgba(239,68,68,0.12)' : 'rgba(var(--accent-rgb),0.12)',
                        border: `1px solid ${pwAction === 'disable' ? 'rgba(239,68,68,0.3)' : 'rgba(var(--accent-rgb),0.3)'}`,
                        color: pwAction === 'disable' ? '#F87171' : 'var(--accent)',
                        cursor: pwLoading ? 'not-allowed' : 'pointer', opacity: pwLoading ? 0.7 : 1,
                      }}
                    >
                      {pwLoading && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
                      {pwLoading ? 'Saving…' :
                        pwAction === 'enable'  ? 'Enable' :
                        pwAction === 'change'  ? 'Change' : 'Disable'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Change password button — only when enabled and no action open */}
        {pwEnabled && pwAction === null && (
          <div className="px-5 py-3.5">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setPwAction('change'); setPwField1(''); setPwField2(''); setPwError(''); }}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
            >
              <Lock size={11} strokeWidth={2} /> Change password
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ── Privacy ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Eye size={16} style={{ color: '#0EA5E9' }} />
          </div>
          <span className="text-sm font-semibold text-white">Privacy</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Hide usernames</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Mask account usernames, display names, and user IDs across all views
              </div>
            </div>
            <Toggle
              checked={hideUsernames}
              onChange={() => setHideUsernames(!hideUsernames)}
              label="Hide usernames"
            />
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Hide descriptions</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Mask descriptions, last place, and the game each account is playing
              </div>
            </div>
            <Toggle
              checked={hideNotes}
              onChange={() => setHideNotes(!hideNotes)}
              label="Hide descriptions"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Bell size={16} style={{ color: '#0EA5E9' }} />
          </div>
          <span className="text-sm font-semibold text-white">Notifications</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {([
            { k: 'notifyCookieExpired' as const, label: 'Cookie expiry alerts',    desc: 'Show notification when a cookie expires' },
            { k: 'notifySessionEnd'   as const, label: 'Session end alerts',       desc: 'Notify when a game session ends unexpectedly' },
            { k: 'notifyNewLogin'     as const, label: 'New device login alerts',  desc: 'Alert when your Roblox account signs in elsewhere' },
          ]).map(({ k, label, desc }) => (
            <div key={k} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
              </div>
              <Toggle checked={notifyToggles[k]} onChange={() => flipNotify(k)} label={label} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Data Management ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(18,18,18,0.90)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Database size={16} style={{ color: '#F97316' }} />
          </div>
          <span className="text-sm font-semibold text-white">Data Management</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleExport} className="btn-ghost justify-start" style={{ width: 'fit-content' }}>
              <Download size={14} /> Export accounts
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => importInputRef.current?.click()}
              className="btn-ghost justify-start" style={{ width: 'fit-content' }}
            >
              <Upload size={14} /> Import accounts
            </motion.button>
            <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => (window.electronAPI as any)?.openLog?.()}
            className="btn-ghost justify-start" style={{ width: 'fit-content' }}
          >
            <FileText size={14} /> Open error log
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', cursor: 'pointer', width: 'fit-content' }}
          >
            <Trash2 size={14} /> Clear all data
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
