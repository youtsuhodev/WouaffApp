import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/Auth/LoginPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PublicGroupsPage from './pages/PublicGroupsPage';
import FeedPage from './pages/FeedPage';
import DownloadPage from './pages/DownloadPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MobileLayout from './components/Layout/MobileLayout';
import TitleBar from './components/Common/TitleBar';
import DownloadBanner from './components/Common/DownloadBanner';
import EmailVerificationBanner from './components/Common/EmailVerificationBanner';
import { CallProvider } from './hooks/useCall';
import IncomingCallOverlay from './components/Call/IncomingCallOverlay';
import ActiveCallBar from './components/Call/ActiveCallBar';
import ConnectionLostOverlay from './components/Common/ConnectionLostOverlay';
import OpenSourceBanner from './components/Common/OpenSourceBanner';
import { ThemeProvider } from './hooks/useTheme';

const PAGE_MAP = {
  '/auth': 'login',
  '/auth?mode=register': 'register',
  '/settings': 'settings',
  '/admin': 'settings',
};

function DiscordPresenceTracker() {
  const loc = useLocation();
  useEffect(() => {
    if (!window.electronAPI?.updateDiscordPresence) return;
    const path = loc.pathname + loc.search;
    for (const [pattern, page] of Object.entries(PAGE_MAP)) {
      if (path === pattern) {
        window.electronAPI.updateDiscordPresence(page);
        return;
      }
    }
    window.electronAPI.updateDiscordPresence('chat');
  }, [loc]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div id="loadingOverlay" className="loading-overlay hidden" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ChatGuard({ children }: { children: React.ReactNode }) {
  const { user, emailVerified, refresh } = useAuth();
  if (!user) return <>{children}</>;
  if (emailVerified) return <>{children}</>;
  return <EmailVerificationBanner onVerified={refresh} />;
}

function CatchAll() {
  const loc = useLocation();
  if (loc.pathname.match(/^\/@(.+)/)) return <ProfilePage />;
  return <ProtectedRoute><MobileLayout><ChatGuard><ChatPage /></ChatGuard></MobileLayout></ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
      <CallProvider>
      <IncomingCallOverlay />
      <ActiveCallBar />
      <ConnectionLostOverlay />
      <OpenSourceBanner />
      <DiscordPresenceTracker />
      <div className="flex flex-col h-dvh">
        <TitleBar />
        <DownloadBanner />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/settings" element={<ProtectedRoute><MobileLayout><SettingsPage /></MobileLayout></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><MobileLayout><FeedPage /></MobileLayout></ProtectedRoute>} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/explore" element={<ProtectedRoute><PublicGroupsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route
              path="/*"
              element={<CatchAll />}
            />
          </Routes>
        </div>
      </div>
      </CallProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
