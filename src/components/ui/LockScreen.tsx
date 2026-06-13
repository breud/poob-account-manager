import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async () => {
    if (!password) { setError('Enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      const ok = await window.electronAPI?.verifyPassword?.(password) ?? true;
      if (ok) {
        onUnlock();
      } else {
        setLoading(false);
        setError('Incorrect password.');
        setShake(true);
        setPassword('');
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setLoading(false);
      setError('Verification failed — try again.');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [password, loading]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--bg, #0C0C0C)', zIndex: 9999 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: shake ? [0, -10, 10, -8, 8, -4, 4, 0] : 1, y: 0 }}
        transition={{ duration: shake ? 0.4 : 0.3 }}
        className="w-full max-w-xs mx-4"
        style={{
          background: 'rgba(18,18,18,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-2xl mb-4"
            style={{
              width: 56, height: 56,
              background: 'rgba(var(--accent-rgb),0.12)',
              border: '1px solid rgba(var(--accent-rgb),0.25)',
              boxShadow: '0 0 24px rgba(var(--accent-rgb),0.15)',
            }}
          >
            <Shield size={26} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-base font-bold text-white">Poob Roblox Account Manager</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Enter your password to continue
          </p>
        </div>

        {/* Password input */}
        <div className="relative mb-2">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
            placeholder="Password"
            autoFocus
            className="input-transition"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12,
              padding: '10px 40px 10px 14px',
              color: 'white',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShow(s => !s)}
            tabIndex={-1}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 2,
            }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: '#F87171' }}>{error}</p>
        )}

        <div style={{ marginTop: error ? 0 : 12 }}>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold"
            style={{
              padding: '11px 0',
              background: 'rgba(var(--accent-rgb),0.14)',
              border: '1px solid rgba(var(--accent-rgb),0.35)',
              color: 'var(--accent)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 150ms, opacity 150ms',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.22)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(var(--accent-rgb),0.14)'; }}
          >
            {loading && <Loader2 size={14} strokeWidth={2} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Unlock'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
