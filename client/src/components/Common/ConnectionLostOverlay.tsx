import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isConnected, offConnectionChange, onConnectionChange } from '../../services/socket';

export default function ConnectionLostOverlay() {
  const { user, loading } = useAuth();
  const [connected, setConnected] = useState(isConnected());

  useEffect(() => {
    if (!user) return;
    setConnected(isConnected());
    const cb = (v: boolean) => setConnected(v);
    onConnectionChange(cb);
    return () => offConnectionChange(cb);
  }, [user]);

  if (!user || loading || connected) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
      <div className="bg-[var(--bg-card)] rounded-2xl px-10 py-12 text-center max-w-[360px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,.4)]">
        <svg
          className="w-14 h-14 text-[var(--text-secondary)] mx-auto mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Connexion perdue"
        >
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M5.5 13.5a9 9 0 0 1 13 0" />
          <path d="M2.5 10.5a13 13 0 0 1 19 0" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6" />
        <div className="text-xl font-bold mb-2">Connexion perdue</div>
        <div className="text-sm text-[var(--text-secondary)]">Veuillez patienter, redémarrage en cours...</div>
      </div>
    </div>
  );
}
