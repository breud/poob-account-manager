import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Star, ChevronDown, LogIn, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

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

export function AddAccountModal() {
  const { isAddAccountOpen, closeAddAccount, addAccount } = useApp();
  const { toast } = useToast();

  const [mode, setMode]               = useState<'roblox' | 'manual'>('roblox');
  const [loginLoading, setLoginLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [cookie, setCookie]     = useState('');
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ username?: string; cookie?: string }>({});

  const reset = () => {
    setUsername(''); setCookie(''); setFavorite(false);
    setErrors({}); setLoading(false); setLoginLoading(false);
    setMode('roblox');
  };

  const handleClose = () => { reset(); closeAddAccount(); };

  const handleRobloxLogin = async () => {
    if (!window.electronAPI) {
      toast('Roblox login is only available in the desktop app.', 'error');
      return;
    }
    setLoginLoading(true);
    try {
      const result = await window.electronAPI.loginWithRoblox();
      if (result) {
        addAccount({
          username: result.username,
          rawCookie: result.cookie,
          isFavorite: false,
          avatarUrl: result.avatarUrl ?? undefined,
          robloxUserId: result.userId ?? undefined,
        });
        toast(`"${result.username}" added successfully.`, 'success');
        reset();
        closeAddAccount();
      } else {
        setLoginLoading(false);
      }
    } catch {
      toast('Login failed. Please try again.', 'error');
      setLoginLoading(false);
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = 'Username is required.';
    if (!cookie.trim())   e.cookie   = 'Cookie (.ROBLOSECURITY) is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleManualSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    addAccount({ username: username.trim(), rawCookie: cookie.trim(), isFavorite: favorite });
    toast(`Account "${username.trim()}" added successfully.`, 'success');
    reset();
    closeAddAccount();
  };

  return (
    <AnimatePresence>
      {isAddAccountOpen && (
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
            className="modal-surface w-full max-w-md mx-4"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div>
                <h2 className="text-sm font-bold text-white leading-snug">Add Account</h2>
                <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Sign in to add your Roblox account
                </p>
              </div>
              <button onClick={handleClose} className="btn-icon" aria-label="Close">
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Roblox login button */}
              <motion.button
                whileHover={loginLoading ? {} : { scale: 1.015 }}
                whileTap={loginLoading ? {} : { scale: 0.975 }}
                onClick={handleRobloxLogin}
                disabled={loginLoading}
                className="relative flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-sm overflow-hidden"
                style={{
                  background: loginLoading
                    ? 'rgba(var(--accent-rgb),0.07)'
                    : 'linear-gradient(135deg, rgba(var(--accent-rgb),0.16) 0%, rgba(var(--accent-rgb),0.08) 100%)',
                  border: '1px solid rgba(var(--accent-rgb),0.32)',
                  color: 'var(--accent)',
                  cursor: loginLoading ? 'not-allowed' : 'pointer',
                  boxShadow: loginLoading ? 'none' : '0 0 22px rgba(var(--accent-rgb),0.08)',
                  transition: 'background 160ms, box-shadow 160ms',
                }}
                onMouseEnter={e => { if (!loginLoading) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(var(--accent-rgb),0.18)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = loginLoading ? 'none' : '0 0 22px rgba(var(--accent-rgb),0.08)'; }}
              >
                {loginLoading ? (
                  <>
                    <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                    <span>Waiting for login…</span>
                    <span className="text-xs font-normal ml-1" style={{ color: 'rgba(var(--accent-rgb),0.55)' }}>
                      (complete in popup)
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} strokeWidth={2} />
                    <span>Log in with Roblox</span>
                  </>
                )}
              </motion.button>

              {loginLoading && (
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  A Roblox login window has opened — sign in there and this will close automatically.
                </p>
              )}

              {/* Divider */}
              {!loginLoading && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
              )}

              {/* Manual toggle */}
              {!loginLoading && (
                <button
                  onClick={() => setMode(m => m === 'roblox' ? 'manual' : 'roblox')}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: mode === 'manual' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${mode === 'manual' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}`,
                    color: mode === 'manual' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.42)',
                    cursor: 'pointer',
                    transition: 'background 150ms, border-color 150ms, color 150ms',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Key size={13} strokeWidth={2} />
                    Enter cookie manually
                  </div>
                  <motion.div animate={{ rotate: mode === 'manual' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} strokeWidth={2} />
                  </motion.div>
                </button>
              )}

              {/* Manual form */}
              <AnimatePresence>
                {mode === 'manual' && !loginLoading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden flex flex-col gap-4"
                  >
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Username <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <input
                        className="input-transition"
                        style={{ ...baseInput, border: errors.username ? '1px solid rgba(239,68,68,0.5)' : baseInput.border }}
                        placeholder="RobloxUsername"
                        value={username}
                        onChange={e => { setUsername(e.target.value); if (errors.username) setErrors(p => ({ ...p, username: undefined })); }}
                      />
                      {errors.username && <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>{errors.username}</p>}
                    </div>

                    {/* Cookie */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        .ROBLOSECURITY Cookie <span style={{ color: '#F87171' }}>*</span>
                      </label>
                      <textarea
                        rows={3}
                        className="input-transition"
                        style={{ ...baseInput, resize: 'none', fontFamily: 'ui-monospace, monospace', fontSize: 11, border: errors.cookie ? '1px solid rgba(239,68,68,0.5)' : baseInput.border }}
                        placeholder="_|WARNING:-DO-NOT-SHARE-THIS.--Sharing..."
                        value={cookie}
                        onChange={e => { setCookie(e.target.value); if (errors.cookie) setErrors(p => ({ ...p, cookie: undefined })); }}
                      />
                      {errors.cookie && <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>{errors.cookie}</p>}
                    </div>

                    {/* Favourite */}
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

                    {/* Submit */}
                    <div className="flex items-center gap-3 pt-1">
                      <button onClick={handleClose} className="btn-cancel flex-1 py-2.5">
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.97 }}
                        onClick={handleManualSubmit}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                        style={{
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
                        {loading && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 14, height: 14, border: '2px solid rgba(var(--accent-rgb),0.25)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}
                          />
                        )}
                        {loading ? 'Adding…' : 'Add Account'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cancel in Roblox mode */}
              {mode === 'roblox' && !loginLoading && (
                <button onClick={handleClose} className="btn-cancel w-full py-2.5">
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
