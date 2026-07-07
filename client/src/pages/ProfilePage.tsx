import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PLATFORMS, parseSocialLinks } from '../utils/socialLinks';

interface BadgeDef {
  name?: string;
  icon?: string;
}
interface ProfileData {
  uid: string;
  profile: Record<string, unknown>;
  badges: Record<string, BadgeDef>;
}

type PageState = 'loading' | 'error' | 'profile';

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c: string) =>
      (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[c],
  );
}

export default function ProfilePage() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rawId = loc.pathname.match(/^\/@(.+)/)?.[1] || null;
  const [state, setState] = useState<PageState>('loading');
  const [errorCode, setErrorCode] = useState('404');
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<ProfileData | null>(null);

  const wouaffId = rawId ? `@${rawId.replace(/^@/, '')}` : null;

  useEffect(() => {
    if (!wouaffId || wouaffId === '@') {
      setErrorCode('400');
      setErrorMsg('Aucun identifiant spécifié.');
      setState('error');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/public/profile/${encodeURIComponent(wouaffId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            setErrorCode('404');
            setErrorMsg("Ce profil n'existe pas.");
          } else {
            setErrorCode('Erreur');
            setErrorMsg('Impossible de charger le profil.');
          }
          setState('error');
          return;
        }
        const json = (await res.json()) as ProfileData;
        if (!json.profile) {
          setErrorCode('404');
          setErrorMsg("Ce profil n'existe pas.");
          setState('error');
          return;
        }
        setData(json);
        setState('profile');
        document.title = `${esc((json.profile.pseudo as string) || 'Utilisateur')} (@${esc(((json.profile.wouaffId as string) || '').replace(/^@/, ''))}) — Wouaff`;
      } catch {
        setErrorCode('Erreur');
        setErrorMsg('Impossible de charger le profil.');
        setState('error');
      }
    })();
  }, [wouaffId]);

  if (state === 'loading') {
    return (
      <div className="profile-page">
        <div className="profile-state active">
          <div className="profile-spinner" />
          <p className="profile-state-text">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="profile-page">
        <div className="profile-state active">
          <div className="profile-error-code">{errorCode}</div>
          <p className="profile-state-text">{errorMsg}</p>
          <Link to="/" className="profile-error-link">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile } = data;
  const p = profile as Record<string, unknown>;
  const pseudo = (p.pseudo as string) || 'Utilisateur';
  const handle = (p.wouaffId as string) || wouaffId || '@---';
  const avatar = p.avatar as string | undefined;
  const bio = p.bio as string | undefined;
  const socialLinks = parseSocialLinks(p.social_links).filter((l) => l.url.trim());
  const ownedBadgesRaw = p.ownedBadges as string[] | Record<string, string> | undefined;
  const uid = data.uid;

  let badgeIds: string[] = [];
  if (ownedBadgesRaw) {
    if (Array.isArray(ownedBadgesRaw)) badgeIds = ownedBadgesRaw.filter(Boolean) as string[];
    else if (typeof ownedBadgesRaw === 'object') badgeIds = Object.values(ownedBadgesRaw).filter(Boolean) as string[];
  }
  const validBadges = badgeIds.map((id) => data.badges[id]).filter((b): b is BadgeDef => !!b && !!b.icon);

  const firstLetter = pseudo.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-state active">
        <div className="profile-card">
          <div className="pp-avatar-wrap">
            {avatar ? (
              <img
                className="pp-avatar"
                src={avatar}
                alt="Avatar"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  (e.target as HTMLElement)
                    .parentElement!.querySelector('.pp-avatar-fallback')
                    ?.classList.add('active');
                }}
              />
            ) : null}
            <div className={`pp-avatar-fallback${!avatar ? ' active' : ''}`}>{firstLetter}</div>
          </div>
          <div className="profile-name">{pseudo}</div>
          <div className="profile-handle">{handle}</div>
          {bio ? <div className="profile-bio">{bio}</div> : null}
          {validBadges.length > 0 && (
            <div className="profile-badges">
              {validBadges.map((b) => (
                <img
                  key={b.icon}
                  className="profile-badge-icon"
                  src={b.icon}
                  alt={b.name || ''}
                  title={b.name || ''}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
          {socialLinks.length > 0 && (
            <div className="profile-social-links">
              {socialLinks.map((link) => {
                const pf = PLATFORMS.find((p) => p.id === link.platform);
                return (
                  <a
                    key={link.url + (pf?.id || '')}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                    title={link.url}
                    style={pf ? ({ '--sl-color': pf.color } as React.CSSProperties) : {}}
                  >
                    {pf && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                        dangerouslySetInnerHTML={{ __html: pf.svg }}
                      />
                    )}
                    <span>{pf?.label || link.platform}</span>
                  </a>
                );
              })}
            </div>
          )}
          <div className="profile-actions">
            {user ? (
              <>
                <button className="profile-btn profile-btn-primary" onClick={() => navigate(`/?chat=${uid}`)}>
                  Message
                </button>
                <button className="profile-btn profile-btn-secondary" onClick={() => navigate(`/?add=${uid}`)}>
                  Ajouter
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="profile-btn profile-btn-primary">
                  Message
                </Link>
                <Link to="/auth" className="profile-btn profile-btn-secondary">
                  Ajouter
                </Link>
              </>
            )}
          </div>
        </div>
        {!user && (
          <div className="profile-login-note">
            <Link to="/auth">Connectez-vous</Link> pour discuter sur Wouaff
          </div>
        )}
        <div className="profile-footer">
          <Link to="/">Wouaff</Link> &mdash; Chat &amp; Réseau Social
        </div>
      </div>
    </div>
  );
}
