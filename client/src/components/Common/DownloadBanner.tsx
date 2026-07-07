import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wouaff_download_banner_dismissed';
const VERSION = '1.0.0';
const DOWNLOAD_URL = 'https://wouaff-app.com/downloads/Wouaff-Setup-1.0.0-win-x64.exe';

export default function DownloadBanner() {
  const [visible, setVisible] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (isElectron) return;
    const dismissed = localStorage.getItem(STORAGE_KEY) === VERSION;
    if (!dismissed) setVisible(true);
  }, [isElectron]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 bg-[var(--accent-soft)] px-4 py-2.5 text-sm" role="alert">
      <span className="text-lg">🆕</span>
      <div className="flex-1 min-w-0">
        <strong className="block">Wouaff v{VERSION} est dispo !</strong>
        <small className="text-text-muted">Télécharge l'app Windows pour une meilleure expérience</small>
      </div>
      <a
        href={DOWNLOAD_URL}
        className="bg-brand text-white px-4 py-1.5 rounded-xl text-xs font-bold no-underline shrink-0"
        download
      >
        Télécharger
      </a>
      <button
        className="bg-transparent border-none text-text-muted text-lg cursor-pointer p-1 shrink-0"
        onClick={dismiss}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
