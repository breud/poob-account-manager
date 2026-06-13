import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Hash, Loader2, Info, RotateCcw, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const LAST_PLACE_KEY = 'ram_last_place_id';

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

export function LaunchModal() {
  const {
    accounts, launchAccountId, closeLaunch,
    bulkLaunchIds, closeBulkLaunch,
    updateAccount, recordLaunch,
  } = useApp();
  const { toast } = useToast();

  const isBulk = bulkLaunchIds.length > 0;

  const account = !isBulk && launchAccountId != null
    ? accounts.find(a => a.id === launchAccountId) ?? null
    : null;

  const bulkAccounts = isBulk
    ? accounts.filter(a => bulkLaunchIds.includes(a.id) && a.rawCookie)
    : [];

  const isOpen = account != null || isBulk;

  const [placeId, setPlaceId]   = useState('');
  const [jobId, setJobId]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [placeErr, setPlaceErr] = useState('');

  // Reset fields when modal opens
  useEffect(() => {
    if (isBulk && bulkLaunchIds.length > 0) {
      setJobId('');
      setPlaceErr('');
      const first = accounts.find(a => a.id === bulkLaunchIds[0]);
      setPlaceId(first?.lastPlaceId ?? localStorage.getItem(LAST_PLACE_KEY) ?? '');
    } else if (!isBulk && launchAccountId != null) {
      setJobId('');
      setPlaceErr('');
      const acct = accounts.find(a => a.id === launchAccountId);
      setPlaceId(acct?.lastPlaceId ?? localStorage.getItem(LAST_PLACE_KEY) ?? '');
    }
  }, [launchAccountId, isBulk, bulkLaunchIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setPlaceErr('');
    setLoading(false);
    if (isBulk) closeBulkLaunch();
    else closeLaunch();
  };

  const handleLaunch = async () => {
    if (!placeId.trim()) { setPlaceErr('Place ID is required.'); return; }
    if (!/^\d+$/.test(placeId.trim())) { setPlaceErr('Place ID must be a number.'); return; }
    setPlaceErr('');

    if (isBulk) { await handleBulkLaunchAll(); return; }

    if (!account?.rawCookie) {
      toast('No cookie stored for this account — re-add it via Log in with Roblox.', 'error');
      return;
    }

    if (placeId.trim()) localStorage.setItem(LAST_PLACE_KEY, placeId.trim());
    setLoading(true);

    if (!window.electronAPI) {
      toast(`[Dev] Would launch ${account.username} into place ${placeId.trim()}.`, 'info');
      setLoading(false);
      handleClose();
      return;
    }

    const result = await window.electronAPI.launchGame({
      accountId: account.id,
      cookie: account.rawCookie,
      placeId: placeId.trim() || undefined,
      jobId: jobId.trim() || undefined,
      fpsLimit: account.fpsLimit ?? 0,
    });

    setLoading(false);

    if (result.ok) {
      if (placeId.trim()) {
        updateAccount(account.id, { lastPlaceId: placeId.trim(), lastUsedAt: new Date().toISOString() });
        recordLaunch(account.id, placeId.trim(), account.username, account.avatarColor, account.avatarUrl);
      }
      toast(placeId.trim() ? `Launching ${account.username}…` : `Opening Roblox home…`, 'success');
      handleClose();
    } else {
      toast(result.error ?? 'Launch failed.', 'error');
    }
  };

  const handleBulkLaunchAll = async () => {
    if (bulkAccounts.length === 0) {
      toast('No accounts with cookies to launch.', 'error');
      return;
    }

    if (placeId.trim()) localStorage.setItem(LAST_PLACE_KEY, placeId.trim());
    setLoading(true);

    let successCount = 0;
    for (let i = 0; i < bulkAccounts.length; i++) {
      const acct = bulkAccounts[i];
      try {
        if (!window.electronAPI) {
          successCount++;
        } else {
          const result = await window.electronAPI.launchGame({
            accountId: acct.id,
            cookie: acct.rawCookie!,
            placeId: placeId.trim() || undefined,
            jobId: jobId.trim() || undefined,
            fpsLimit: acct.fpsLimit ?? 0,
          });
          if (result.ok) {
            successCount++;
            updateAccount(acct.id, { lastPlaceId: placeId.trim(), lastUsedAt: new Date().toISOString() });
            recordLaunch(acct.id, placeId.trim(), acct.username, acct.avatarColor, acct.avatarUrl);
          }
        }
      } catch {}
      if (i < bulkAccounts.length - 1) {
        await new Promise<void>(r => setTimeout(r, 1500));
      }
    }

    setLoading(false);
    toast(
      `Launched ${successCount} of ${bulkAccounts.length} account${bulkAccounts.length !== 1 ? 's' : ''}`,
      successCount > 0 ? 'success' : 'error',
    );
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                {isBulk ? (
                  <>
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ width: 36, height: 36, background: 'rgba(var(--accent-rgb),0.12)', border: '1.5px solid rgba(var(--accent-rgb),0.3)', color: 'var(--accent)' }}
                    >
                      <Users size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white leading-snug">
                        Launch {bulkAccounts.length} Account{bulkAccounts.length !== 1 ? 's' : ''}
                      </h2>
                      <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        Accounts will launch sequentially
                      </p>
                    </div>
                  </>
                ) : account ? (
                  <>
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.username}
                        style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${account.avatarColor}40`, flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded-xl text-xs font-bold flex-shrink-0"
                        style={{ width: 36, height: 36, background: `${account.avatarColor}20`, border: `1.5px solid ${account.avatarColor}40`, color: account.avatarColor }}
                      >
                        {account.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-bold text-white leading-snug">Launch Game</h2>
                      <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>{account.username}</p>
                    </div>
                  </>
                ) : null}
              </div>
              <button onClick={handleClose} className="btn-icon" aria-label="Close">
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Bulk avatar row */}
              {isBulk && bulkAccounts.length > 0 && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl flex-wrap"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {bulkAccounts.slice(0, 8).map(a => (
                    <div
                      key={a.id}
                      title={a.username}
                      className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                      style={{
                        width: 28, height: 28,
                        background: `${a.avatarColor}20`,
                        border: `1px solid ${a.avatarColor}40`,
                        color: a.avatarColor,
                      }}
                    >
                      {a.username.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {bulkAccounts.length > 8 && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      +{bulkAccounts.length - 8} more
                    </span>
                  )}
                </div>
              )}

              {/* Place ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <Gamepad2 size={11} strokeWidth={2} />
                    Place ID
                    <span style={{ color: '#F87171', fontWeight: 400 }}>*</span>
                  </label>
                  {!isBulk && account?.lastPlaceId && account.lastPlaceId !== placeId && (
                    <button
                      onClick={() => setPlaceId(account.lastPlaceId!)}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'rgba(255,255,255,0.32)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 150ms' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.32)')}
                    >
                      <RotateCcw size={9} strokeWidth={2} /> Last: {account.lastPlaceId}
                    </button>
                  )}
                </div>
                <input
                  className="input-transition"
                  style={{ ...baseInput, border: placeErr ? '1px solid rgba(239,68,68,0.5)' : baseInput.border }}
                  placeholder="e.g. 6872265039"
                  value={placeId}
                  onChange={e => { setPlaceId(e.target.value); if (placeErr) setPlaceErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLaunch()}
                  autoFocus
                />
                {placeErr
                  ? <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>{placeErr}</p>
                  : <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      <Info size={9} /> Found in the Roblox game URL after /games/
                    </p>
                }
              </div>

              {/* Job ID */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <Hash size={11} strokeWidth={2} />
                  Job ID <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="input-transition"
                  style={baseInput}
                  placeholder="e.g. 7a2a9c4b-1234-5678-abcd-ef0123456789"
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLaunch()}
                />
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  <Info size={9} /> Leave blank to join any available server
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="btn-cancel flex-1 py-2.5"
                  style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  onClick={handleLaunch}
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
                  {loading && <Loader2 size={14} strokeWidth={2} className="animate-spin" />}
                  {loading
                    ? 'Launching…'
                    : isBulk
                      ? `Launch All (${bulkAccounts.length})`
                      : 'Launch Game'
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
