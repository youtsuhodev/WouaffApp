import { useLocation, useNavigate } from 'react-router-dom';

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
  storyBadge?: boolean;
}

export default function HamburgerMenu({ open, onClose, storyBadge }: HamburgerMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isChat = location.pathname === '/' || location.pathname === '' || location.pathname.match(/^\/@/);
  const isSettings = location.pathname === '/settings';
  const isExplore = location.pathname === '/explore';
  const isFeed = location.pathname === '/feed';

  const items = [
    { path: '/', label: 'Discussions', active: isChat, icon: 'bi-chat-dots' },
    {
      path: '/',
      label: 'Stories',
      active: isChat,
      icon: 'bi-camera',
      badge: storyBadge,
      onClick: () => {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById('storiesBar') || document.querySelector('.stories-bar');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      },
    },
    { path: '/explore', label: 'Explorer', active: isExplore, icon: 'bi-compass' },
    { path: '/feed', label: 'Feed', active: isFeed, icon: 'bi-newspaper' },
    { path: '/settings', label: 'Paramètres', active: isSettings, icon: 'bi-gear' },
  ];

  const handleNav = (item: typeof items[0]) => {
    if (item.onClick) {
      item.onClick();
    } else {
      navigate(item.path);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="hamburger-overlay" onClick={onClose}>
      <div className="hamburger-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hamburger-header">
          <i className="bi bi-chat-square-text fs-4" style={{ color: 'var(--brand)' }} />
          <span>Menu</span>
        </div>
        <div className="hamburger-items">
          {items.map((item, i) => (
            <button
              key={i}
              className={`hamburger-item${item.active ? ' active' : ''}`}
              onClick={() => handleNav(item)}
            >
              <i className={`bi ${item.icon} fs-5`} />
              <span>{item.label}</span>
              {item.badge && <span className="hamburger-badge" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}