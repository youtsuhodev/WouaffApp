import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Email vérifié avec succès !');
        } else {
          setStatus('error');
          setMessage(data.error || 'Échec de la vérification.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur lors de la vérification.');
      });
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-dvh bg-[var(--bg-page)] p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-center mb-2">
          <img src="/assets/logo/logo.png" alt="Logo Wouaff" className="w-12 h-12 mb-2 inline-block" />
          <h1 className="text-xl font-bold m-0">Wouaff</h1>
        </div>
        <div className="py-5">
          {status === 'loading' && (
            <>
              <div className="text-5xl mb-4 animate-spin">⏳</div>
              <p className="text-text-secondary text-sm">Vérification de votre email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-bold">Email vérifié !</h2>
              <p className="text-text-secondary text-sm mt-2">{message}</p>
              <Link
                to="/"
                className="inline-block mt-4 bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm no-underline"
              >
                Accéder à Wouaff
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-lg font-bold">Échec de la vérification</h2>
              <p className="text-[#ea4335] text-sm mt-2">{message}</p>
              <Link to="/auth" className="text-brand mt-4 inline-block text-sm">
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
