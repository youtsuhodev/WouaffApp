import { useState } from 'react';

export default function EmailVerificationBanner({ onVerified }: { onVerified: () => void }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      if (data.alreadyVerified) {
        onVerified();
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-lg font-bold mb-2">Email envoyé !</h3>
            <p className="text-text-secondary text-sm mb-6">
              Un email de vérification vous a été envoyé. Vérifiez votre boîte de réception et cliquez sur le lien pour
              confirmer votre adresse.
            </p>
            <button
              className="w-full bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm border-none cursor-pointer font-sans"
              onClick={onVerified}
            >
              J'ai vérifié mon email
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-bold mb-2">Vérification requise</h3>
            <p className="text-text-secondary text-sm mb-6">
              Vous devez vérifier votre adresse email avant d'accéder à vos conversations. Cela nous permet de sécuriser
              votre compte.
            </p>

            <div className="flex items-start gap-2 bg-[var(--bg-page)] rounded-xl p-4 mb-4 text-left text-sm text-text-secondary">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Un email va être envoyé à l'adresse associée à votre compte.</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg px-3 py-2.5 mb-4 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                className="w-full bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm border-none cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Envoi en cours...' : "Envoyer l'email de vérification"}
              </button>
              <button
                className="w-full bg-transparent text-text-muted px-6 py-3 rounded-xl font-bold text-sm border border-border cursor-not-allowed font-sans opacity-40"
                onClick={() => {}}
                disabled
              >
                Plus tard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
