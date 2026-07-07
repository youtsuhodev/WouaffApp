import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  ChevronRight,
  Circle,
  Edit3,
  Flag,
  Key,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { admin as adminAPI, profiles } from '../services/api';
import type { UserProfile } from '../types';

type Tab = 'dashboard' | 'users' | 'staff' | 'logs';
type ToastItem = { id: number; msg: string; type: 'success' | 'error' | 'info' };

let toastId = 0;

const ACTIONS_LABELS: Record<string, string> = {
  staff_add: 'Ajout staff',
  staff_remove: 'Retrait staff',
  profile_update: 'Modification profil',
  badge_update: 'Mise à jour badges',
  account_delete: 'Suppression compte',
  wouaffid_reset: 'Réinitialisation ID',
  migrate_wouaff_ids: 'Migration IDs',
  maintenance_on: 'Maintenance activée',
  maintenance_off: 'Maintenance désactivée',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  staff_add: <UserPlus size={14} />,
  staff_remove: <UserMinus size={14} />,
  profile_update: <Edit3 size={14} />,
  badge_update: <Award size={14} />,
  account_delete: <Trash2 size={14} />,
  wouaffid_reset: <RefreshCw size={14} />,
  migrate_wouaff_ids: <Link2 size={14} />,
  maintenance_on: <ShieldAlert size={14} />,
  maintenance_off: <ShieldAlert size={14} />,
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 size={18} /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
  { id: 'staff', label: 'Staff', icon: <Shield size={18} /> },
  { id: 'logs', label: 'Activité', icon: <Activity size={18} /> },
];

const STAT_CARDS = [
  { key: 'users', label: 'Utilisateurs', icon: <User size={18} />, color: 'var(--brand)' },
  { key: 'chats', label: 'Conversations', icon: <MessageSquare size={18} />, color: '#8b5cf6' },
  { key: 'messages', label: 'Messages', icon: <Mail size={18} />, color: '#06b6d4' },
  { key: 'online', label: 'En ligne', icon: <Circle size={18} />, color: '#22c55e', online: true },
  { key: 'badges', label: 'Badges', icon: <Award size={18} />, color: '#f59e0b' },
  { key: 'wouaffIds', label: 'Identifiants', icon: <Link2 size={18} />, color: '#ec4899' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isStaff, setIsStaff] = useState(false);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Dashboard state */
  const [stats, setStats] = useState<{
    users: number;
    chats: number;
    messages: number;
    online: number;
    badges: number;
    wouaffIds: number;
  } | null>(null);

  /* Users state */
  const [recentUsers, setRecentUsers] = useState<Record<string, UserProfile>>({});

  /* Search state */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState<{ uid: string; profile: UserProfile } | null>(null);
  const [editData, setEditData] = useState({ pseudo: '', bio: '', avatar: '', banner: '', wouaffId: '' });
  const [editMsg, setEditMsg] = useState('');
  const [badgeDefs, setBadgeDefs] = useState<Record<string, { name?: string; icon?: string }>>({});
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [badgeMsg, setBadgeMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  /* Staff state */
  const [staffList, setStaffList] = useState<Record<string, UserProfile>>({});
  const [staffUidInput, setStaffUidInput] = useState('');
  const [staffMsg, setStaffMsg] = useState('');

  /* Logs state */
  const [logs, setLogs] = useState<
    Array<{
      id: number;
      adminUid: string;
      action: string;
      targetType: string | null;
      targetId: string | null;
      details: string | null;
      createdAt: number;
    }>
  >([]);
  const [logProfiles, setLogProfiles] = useState<Record<string, { pseudo: string; avatar?: string }>>({});
  const [logsLoading, setLogsLoading] = useState(false);

  /* Reports state */
  const [reports, setReports] = useState<
    Array<{
      gid: string;
      name: string;
      reportedBy: string;
      reportedAt: number;
    }>
  >([]);
  const [showReports, setShowReports] = useState(false);

  /* Maintenance state */
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const p = (await profiles.get(user!.uid)) as unknown as UserProfile;
        setProfile(p);
        const staffRes = await adminAPI.staff
          .list()
          .then(() => true)
          .catch(() => false);
        setIsStaff(staffRes);
        if (staffRes) {
          adminAPI
            .stats()
            .then(setStats)
            .catch((e) => {
              console.error(e);
            });
          adminAPI.users
            .recent()
            .then(setRecentUsers)
            .catch((e) => {
              console.error(e);
            });
          adminAPI.badges
            .list()
            .then((data) => setBadgeDefs(data as Record<string, { name?: string; icon?: string }>))
            .catch((e) => {
              console.error(e);
            });
          adminAPI.maintenance
            .get()
            .then((m) => {
              setMaintenanceOn(m.enabled);
              setMaintenanceMsg(m.message ?? '');
            })
            .catch(() => {});
        }
      } catch (e) {
        console.error(e);
      }
      setChecking(false);
    })();
  }, [user]);

  const loadStats = async () => {
    const s = await adminAPI.stats().catch(() => null);
    if (s) setStats(s);
  };

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const newState = !maintenanceOn;
      await adminAPI.maintenance.set(newState, maintenanceMsg || undefined);
      setMaintenanceOn(newState);
      toast(newState ? 'Mode maintenance activé' : 'Mode maintenance désactivé', 'success');
    } catch {
      toast("Erreur lors du changement d'état", 'error');
    }
    setMaintenanceLoading(false);
  };

  const loadRecentUsers = async () => {
    const u = await adminAPI.users.recent().catch(() => ({}));
    setRecentUsers(u);
  };

  const loadStaff = async () => {
    const s = await adminAPI.staff.list().catch(() => ({}));
    setStaffList(s);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const l = await adminAPI.logs();
      setLogs(l);
      const pMap: Record<string, { pseudo: string; avatar?: string }> = {};
      const seen = new Set<string>();
      for (const log of l) {
        if (seen.has(log.adminUid)) continue;
        seen.add(log.adminUid);
        try {
          const p = (await profiles.get(log.adminUid)) as unknown as UserProfile;
          pMap[log.adminUid] = { pseudo: p.pseudo || log.adminUid.slice(0, 8), avatar: p.avatar };
        } catch {
          pMap[log.adminUid] = { pseudo: log.adminUid.slice(0, 8) };
        }
      }
      setLogProfiles(pMap);
    } catch (e) {
      console.error(e);
    }
    setLogsLoading(false);
  };

  const loadReports = async () => {
    try {
      const r = await adminAPI.reports();
      setReports(r);
      setShowReports(true);
    } catch {
      toast('Erreur chargement signalements', 'error');
    }
  };

  const searchProfile = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    setEditMsg('');
    setBadgeMsg('');
    setActionMsg('');
    try {
      let uid: string;
      let prof: UserProfile;
      if (q.startsWith('@')) {
        const res = await fetch(`/api/search/users/${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Utilisateur introuvable');
        const data = (await res.json()) as { uid: string; profile: UserProfile };
        uid = data.uid;
        prof = data.profile;
      } else {
        const res = await fetch(`/api/profiles/${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Utilisateur introuvable');
        prof = (await res.json()) as UserProfile;
        uid = q;
      }
      if (!prof?.pseudo) throw new Error('Profil introuvable');
      setSearchResult({ uid, profile: prof });
      setEditData({
        pseudo: prof.pseudo || '',
        bio: prof.bio || '',
        avatar: prof.avatar || '',
        banner: prof.banner || '',
        wouaffId: prof.wouaffId || '',
      });
      const rawBadges = prof.ownedBadges;
      let ids: string[] = [];
      if (rawBadges) {
        if (Array.isArray(rawBadges)) ids = rawBadges.filter(Boolean) as string[];
        else if (typeof rawBadges === 'object')
          ids = Object.values(rawBadges as Record<string, string>).filter(Boolean);
      }
      setSelectedBadges(ids);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Erreur');
    }
    setSearchLoading(false);
  };

  const saveProfile = async () => {
    if (!searchResult) return;
    const { uid } = searchResult;
    const data: Record<string, string> = {};
    if (editData.pseudo !== searchResult.profile.pseudo) data.pseudo = editData.pseudo;
    if (editData.bio !== (searchResult.profile.bio || '')) data.bio = editData.bio;
    if (editData.avatar !== (searchResult.profile.avatar || '')) data.avatar = editData.avatar;
    if (editData.banner !== (searchResult.profile.banner || '')) data.banner = editData.banner;
    if (editData.wouaffId !== (searchResult.profile.wouaffId || '')) {
      if (!editData.wouaffId.startsWith('@')) {
        setEditMsg("L'identifiant doit commencer par @");
        return;
      }
      data.wouaffId = editData.wouaffId;
    }
    if (Object.keys(data).length === 0) {
      setEditMsg('Aucune modification');
      return;
    }
    try {
      await adminAPI.profile.update(uid, data);
      adminAPI.logAction('profile_update', 'user', uid, Object.keys(data).join(', '));
      setEditMsg('✓ Profil mis à jour');
      toast('Profil mis à jour', 'success');
      setSearchResult({ ...searchResult, profile: { ...searchResult.profile, ...data } });
    } catch (e) {
      setEditMsg(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const toggleBadge = (id: string) => {
    setSelectedBadges((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const saveBadges = async () => {
    if (!searchResult) return;
    try {
      await adminAPI.badges.set(searchResult.uid, selectedBadges);
      adminAPI.logAction('badge_update', 'user', searchResult.uid, selectedBadges.join(', '));
      setBadgeMsg('✓ Badges mis à jour');
      toast('Badges mis à jour', 'success');
    } catch (e) {
      setBadgeMsg(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const resetWouaffId = async () => {
    if (!searchResult || !confirm('Réinitialiser le Wouaff ID de cet utilisateur ?')) return;
    try {
      await adminAPI.profile.resetWouaffId(searchResult.uid);
      adminAPI.logAction('wouaffid_reset', 'user', searchResult.uid);
      setActionMsg('✓ Wouaff ID réinitialisé');
      toast('Wouaff ID réinitialisé', 'success');
      setEditData((prev) => ({ ...prev, wouaffId: '' }));
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const deleteAccount = async () => {
    if (!searchResult) return;
    if (!confirm('⚠️ Supprimer définitivement ce compte ?')) return;
    if (!confirm('⚠️ Confirmer la suppression définitive ? Cette action est irréversible.')) return;
    try {
      await adminAPI.profile.delete(searchResult.uid);
      adminAPI.logAction('account_delete', 'user', searchResult.uid, searchResult.profile.pseudo);
      toast('Compte supprimé', 'success');
      setSearchResult(null);
      setSearchQuery('');
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const seedBadges = async () => {
    const res = await adminAPI.badges.seed().catch(() => null);
    if (res) {
      if (res.created.length > 0) toast(`Badges créés : ${res.created.join(', ')}`, 'success');
      else toast('Tous les badges existent déjà', 'info');
      adminAPI.badges
        .list()
        .then((data) => setBadgeDefs(data as Record<string, { name?: string; icon?: string }>))
        .catch((e) => {
          console.error(e);
        });
    } else {
      toast('Erreur lors du seed des badges', 'error');
    }
  };

  const addStaff = async () => {
    const uid = staffUidInput.trim();
    if (!uid) return;
    try {
      await adminAPI.staff.add(uid);
      setStaffMsg(`✓ ${uid} ajouté au staff`);
      toast('Membre ajouté au staff', 'success');
      setStaffUidInput('');
      loadStaff();
    } catch (e) {
      setStaffMsg(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const removeStaff = async (uid: string) => {
    if (!confirm(`Retirer ${uid} du staff ?`)) return;
    try {
      await adminAPI.staff.remove(uid);
      toast('Membre retiré du staff', 'success');
      loadStaff();
    } catch {
      toast('Erreur', 'error');
    }
  };

  const clickUser = (uid: string) => {
    setSearchQuery(uid);
    setActiveTab('users');
    setSearchResult(null);
    setTimeout(() => {
      searchProfile();
    }, 100);
  };

  if (checking) {
    return (
      <div className="admin-page">
        <div className="admin-center">
          <div className="admin-spinner" />
          <p className="admin-muted">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="admin-page">
        <div className="admin-center">
          <div className="admin-forbidden-icon">
            <Lock size={48} />
          </div>
          <h2 className="admin-forbidden-title">Accès refusé</h2>
          <p className="admin-muted">Vous n'avez pas les permissions nécessaires.</p>
          <button className="admin-btn admin-btn-primary mt-3" onClick={() => navigate('/')}>
            Retour au chat
          </button>
          <button
            className="admin-btn admin-btn-secondary mt-2"
            onClick={async () => {
              try {
                const r = await adminAPI.bootstrap();
                if (r.success) {
                  setIsStaff(true);
                  toast('Vous êtes maintenant staff !', 'success');
                }
              } catch (e) {
                toast(e instanceof Error ? e.message : 'Erreur', 'error');
              }
            }}
          >
            <Key size={16} /> Devenir premier admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`}>
          <div className="admin-sidebar-brand">
            <div className="admin-brand-icon">
              <Shield size={20} />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-name">Panneau d'administration</span>
              <span className="admin-brand-sub">Wouaff</span>
            </div>
          </div>

          {profile && (
            <div className="admin-self-card">
              <div className="admin-self-avatar">
                {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{(profile.pseudo || '?')[0]}</span>}
              </div>
              <div className="admin-self-info">
                <div className="admin-self-name">{profile.pseudo || 'Staff'}</div>
                <div className="admin-self-badge">
                  <Shield size={10} /> Staff
                </div>
              </div>
            </div>
          )}

          <nav className="admin-menu">
            {TABS.map((t) => (
              <div
                key={t.id}
                className={`admin-menu-item${activeTab === t.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(t.id);
                  setMobileOpen(false);
                }}
              >
                <span className="admin-menu-icon">{t.icon}</span>
                {t.label}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button className="admin-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              Retour
            </button>
            <button className="admin-logout-btn" onClick={logout}>
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </aside>

        <div className="admin-mobile-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-mobile-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <main className="admin-main">
          {activeTab === 'dashboard' && (
            <div className="admin-panel active">
              <div className="admin-panel-header">
                <h2>Tableau de bord</h2>
                <p>Vue d'ensemble de la plateforme Wouaff.</p>
              </div>

              {stats && (
                <div className="admin-stats-grid">
                  {STAT_CARDS.map((s) => (
                    <div
                      key={s.key}
                      className="admin-stat-card"
                      style={{ '--stat-color': s.color } as React.CSSProperties}
                    >
                      <div className="admin-stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                        {s.icon}
                      </div>
                      <div className={`admin-stat-value${s.online ? ' admin-stat-online' : ''}`}>
                        {stats[s.key as keyof typeof stats]}
                      </div>
                      <div className="admin-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-actions-row">
                <button className="admin-btn admin-btn-primary" onClick={loadStats}>
                  <RefreshCw size={16} /> Actualiser
                </button>
                <button className="admin-btn admin-btn-accent" onClick={seedBadges}>
                  <Award size={16} /> Seed badges
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={async () => {
                    const r = await adminAPI.migrate.wouaffIds();
                    toast(`${r.migrated} identifiants indexés`, 'success');
                  }}
                >
                  <Link2 size={16} /> Migrer wouaffIds
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={loadReports}>
                  <Flag size={16} /> Signalements
                </button>
                <button
                  className={`admin-btn ${maintenanceOn ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                  onClick={toggleMaintenance}
                  disabled={maintenanceLoading}
                >
                  <ShieldAlert size={16} /> {maintenanceOn ? 'Désactiver maintenance' : 'Activer maintenance'}
                </button>
              </div>
              {maintenanceOn && (
                <div className="admin-card mt-1">
                  <div className="admin-card-title">
                    <ShieldAlert size={16} /> Message de maintenance
                  </div>
                  <textarea
                    className="admin-input admin-textarea mt-1"
                    rows={2}
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    placeholder="Message optionnel affiché aux utilisateurs..."
                  />
                  <button className="admin-btn admin-btn-primary mt-1" onClick={toggleMaintenance} disabled={maintenanceLoading}>
                    <Save size={16} /> Appliquer
                  </button>
                </div>
              )}

              {showReports && (
                <div className="admin-card mt-1">
                  <div className="admin-card-title">
                    <Flag size={16} /> Groupes signalés
                    <button className="admin-card-close" onClick={() => setShowReports(false)}>
                      <X size={14} />
                    </button>
                  </div>
                  {reports.length === 0 ? (
                    <p className="admin-muted">Aucun signalement</p>
                  ) : (
                    <div className="admin-user-list">
                      {reports.map((r) => (
                        <div
                          key={r.gid}
                          className="admin-user-item"
                          onClick={() => {
                            setSearchQuery(r.gid);
                            setActiveTab('users');
                          }}
                        >
                          <div className="admin-user-avatar">
                            <Flag size={16} />
                          </div>
                          <div className="admin-user-info">
                            <div className="admin-user-name">{r.name || 'Groupe sans nom'}</div>
                            <div className="admin-user-id">Signalé par {r.reportedBy.slice(0, 8)}...</div>
                          </div>
                          <div className="admin-user-uid">{timeAgo(r.reportedAt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-panel active">
              <div className="admin-panel-header">
                <h2>Utilisateurs</h2>
                <p>Recherche et gestion des profils.</p>
              </div>

              <div className="admin-search-row">
                <input
                  className="admin-input"
                  placeholder="@wouaff_id, UID ou gid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchProfile()}
                />
                <button className="admin-btn admin-btn-primary" onClick={searchProfile} disabled={searchLoading}>
                  {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResult(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {searchError && <div className="admin-msg admin-msg-error">{searchError}</div>}

              {searchResult && (
                <div className="admin-profile-section">
                  <div className="admin-profile-card">
                    {searchResult.profile.banner && (
                      <div
                        className="admin-profile-banner"
                        style={{ backgroundImage: `url(${searchResult.profile.banner})` }}
                      />
                    )}
                    <div className="admin-profile-card-body">
                      <div className="admin-profile-avatar-wrap">
                        {searchResult.profile.avatar ? (
                          <img
                            className="admin-profile-avatar-img"
                            src={searchResult.profile.avatar}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="admin-profile-avatar-fallback">{(searchResult.profile.pseudo || '?')[0]}</div>
                        )}
                      </div>
                      <div className="admin-profile-name">{searchResult.profile.pseudo || 'Utilisateur'}</div>
                      <div className="admin-profile-handle">{searchResult.profile.wouaffId || '(aucun)'}</div>
                      <div className="admin-profile-uid">{searchResult.uid}</div>
                      {searchResult.profile.bio && <div className="admin-profile-bio">{searchResult.profile.bio}</div>}
                      <div className="admin-profile-badges">
                        {selectedBadges.length > 0 ? (
                          selectedBadges.map((id) =>
                            badgeDefs[id] ? (
                              <span key={id} className={`admin-badge-chip${id === 'staff' ? ' staff-chip' : ''}`}>
                                {badgeDefs[id].icon && <img src={badgeDefs[id].icon} alt="" />}
                                {badgeDefs[id].name || id}
                              </span>
                            ) : null,
                          )
                        ) : (
                          <span className="admin-muted">Aucun badge</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-title">
                      <Edit3 size={16} /> Modifier le profil
                    </div>
                    <div className="admin-field">
                      <label htmlFor="adminPseudo">Pseudo</label>
                      <input
                        id="adminPseudo"
                        className="admin-input"
                        value={editData.pseudo}
                        onChange={(e) => setEditData((p) => ({ ...p, pseudo: e.target.value }))}
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="adminBio">Bio</label>
                      <textarea
                        id="adminBio"
                        className="admin-input admin-textarea"
                        value={editData.bio}
                        onChange={(e) => setEditData((p) => ({ ...p, bio: e.target.value }))}
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="adminAvatar">Avatar URL</label>
                      <input
                        id="adminAvatar"
                        className="admin-input"
                        value={editData.avatar}
                        onChange={(e) => setEditData((p) => ({ ...p, avatar: e.target.value }))}
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="adminBanner">Bannière URL</label>
                      <input
                        id="adminBanner"
                        className="admin-input"
                        value={editData.banner}
                        onChange={(e) => setEditData((p) => ({ ...p, banner: e.target.value }))}
                      />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="adminWouaffId">Identifiant Wouaff</label>
                      <input
                        id="adminWouaffId"
                        className="admin-input"
                        value={editData.wouaffId}
                        onChange={(e) => setEditData((p) => ({ ...p, wouaffId: e.target.value }))}
                        placeholder="@identifiant"
                      />
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={saveProfile}>
                      <Save size={16} /> Enregistrer
                    </button>
                    {editMsg && <div className="admin-msg">{editMsg}</div>}
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-title">
                      <Award size={16} /> Gestion des badges
                    </div>
                    <div className="admin-badge-grid">
                      {Object.entries(badgeDefs).map(([id, b]) => (
                        <div
                          key={id}
                          className={`admin-badge-opt${selectedBadges.includes(id) ? ' selected' : ''}`}
                          onClick={() => toggleBadge(id)}
                        >
                          {b.icon && <img src={b.icon} alt="" />}
                          <span>{b.name || id}</span>
                        </div>
                      ))}
                    </div>
                    <button className="admin-btn admin-btn-primary mt-3" onClick={saveBadges}>
                      <Save size={16} /> Sauvegarder
                    </button>
                    {badgeMsg && <div className="admin-msg">{badgeMsg}</div>}
                  </div>

                  <div className="admin-card admin-card-danger">
                    <div className="admin-card-title">
                      <AlertTriangle size={16} /> Actions sur le compte
                    </div>
                    <button className="admin-btn admin-btn-warning mr-2" onClick={resetWouaffId}>
                      <RefreshCw size={16} /> Réinitialiser l'ID
                    </button>
                    <button className="admin-btn admin-btn-danger" onClick={deleteAccount}>
                      <Trash2 size={16} /> Supprimer le compte
                    </button>
                    {actionMsg && <div className="admin-msg">{actionMsg}</div>}
                  </div>
                </div>
              )}

              <div className="admin-section-divider">
                <span>Utilisateurs récents</span>
                <button className="admin-btn admin-btn-secondary px-3 py-1.5 text-xs" onClick={loadRecentUsers}>
                  <RefreshCw size={12} /> Charger
                </button>
              </div>

              <div className="admin-user-list">
                {Object.entries(recentUsers).length === 0 && <p className="admin-muted">Aucun utilisateur</p>}
                {Object.entries(recentUsers)
                  .reverse()
                  .map(([uid, p]) => (
                    <div key={uid} className="admin-user-item" onClick={() => clickUser(uid)}>
                      <div className="admin-user-avatar">
                        {p.avatar ? <img src={p.avatar} alt="" /> : <span>{(p.pseudo || '?')[0]}</span>}
                      </div>
                      <div className="admin-user-info">
                        <div className="admin-user-name">{p.pseudo || '(sans pseudo)'}</div>
                        <div className="admin-user-id">{p.wouaffId || "pas d'ID"}</div>
                      </div>
                      <ChevronRight size={14} className="admin-user-chevron" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="admin-panel active">
              <div className="admin-panel-header">
                <h2>Gestion du staff</h2>
                <p>Ajouter ou retirer des membres du staff.</p>
              </div>

              <div className="admin-card">
                <div className="admin-card-title">
                  <UserPlus size={16} /> Ajouter un membre
                </div>
                <div className="admin-search-row">
                  <input
                    className="admin-input"
                    placeholder="UID Firebase..."
                    value={staffUidInput}
                    onChange={(e) => setStaffUidInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStaff()}
                  />
                  <button className="admin-btn admin-btn-primary" onClick={addStaff}>
                    <UserPlus size={16} /> Ajouter
                  </button>
                </div>
                {staffMsg && <div className="admin-msg">{staffMsg}</div>}
              </div>

              <div className="admin-section-divider">
                <span>Membres du staff</span>
              </div>

              <div className="admin-user-list">
                {Object.keys(staffList).length === 0 && (
                  <p className="admin-muted p-3">Aucun membre. Cliquez sur "Charger".</p>
                )}
                <button className="admin-btn admin-btn-secondary mb-2" onClick={loadStaff}>
                  <RefreshCw size={14} /> Charger la liste
                </button>
                {Object.entries(staffList).map(([uid, p]) => (
                  <div key={uid} className="admin-user-item">
                    <div className="admin-user-avatar bg-gradient-to-br from-brand to-amber-500">
                      {p.avatar ? <img src={p.avatar} alt="" /> : <Shield size={16} />}
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-name">{p.pseudo || uid.slice(0, 8)}</div>
                      <div className="admin-user-id">{p.wouaffId || `${uid.slice(0, 12)}...`}</div>
                    </div>
                    <button
                      className="admin-btn admin-btn-danger px-2.5 py-1.5 text-[11px]"
                      onClick={() => removeStaff(uid)}
                    >
                      <UserMinus size={12} /> Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="admin-panel active">
              <div className="admin-panel-header">
                <h2>Activité du staff</h2>
                <p>Dernières actions des administrateurs.</p>
              </div>

              <button className="admin-btn admin-btn-secondary mb-4" onClick={loadLogs}>
                {logsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Charger l'activité
              </button>

              {logs.length === 0 && !logsLoading && (
                <div className="admin-card text-center p-8">
                  <Activity size={32} className="opacity-30 mb-2" />
                  <p className="admin-muted">Aucune activité enregistrée</p>
                </div>
              )}

              <div className="admin-log-list">
                {logs.map((log) => (
                  <div key={log.id} className="admin-log-item">
                    <div className="admin-log-icon">{ACTION_ICONS[log.action] || <Activity size={14} />}</div>
                    <div className="admin-log-info">
                      <div className="admin-log-action">{ACTIONS_LABELS[log.action] || log.action}</div>
                      <div className="admin-log-meta">
                        {logProfiles[log.adminUid]?.pseudo || log.adminUid.slice(0, 8)}
                        {log.targetId && (
                          <>
                            {' '}
                            · <code>{log.targetId.slice(0, 12)}...</code>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="admin-log-time">{timeAgo(log.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="admin-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
