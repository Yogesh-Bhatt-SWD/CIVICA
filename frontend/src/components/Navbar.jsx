import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Logo from './Logo';

const NAV_LINKS = {
  citizen:   [{ to: '/dashboard',  label: 'My Dashboard' }],
  authority: [{ to: '/authority',  label: 'Issue Queue' }],
  admin:     [{ to: '/admin',      label: 'Authority Panel' }],
};

const ROLE_COLORS = {
  citizen:   { bg: 'var(--accent-dim)',  color: 'var(--accent)' },
  authority: { bg: 'var(--blue-dim)',    color: 'var(--blue)' },
  admin:     { bg: 'rgba(168,85,247,.15)', color: '#a855f7' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const roleStyle = user ? ROLE_COLORS[user.role] : {};
  let links = user ? NAV_LINKS[user.role] || [] : [];
  
  // Authority Panel logic: Rename Admin Panel label
  if (user?.role === 'admin') {
     links = links.map(l => l.to === '/admin' ? { ...l, label: 'Authority Panel' } : l);
  }

  // Clean homepage: Hide admin/authority actions from navbar on the landing page
  if (location.pathname === '/') {
    links = links.filter(l => l.to === '/dashboard');
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 64,
      background: 'rgba(10, 15, 30, 0.75)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      zIndex: 900,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 20,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, marginRight: 'auto' }}>
        <Logo size={42} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Civica
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>
            Urban Intelligence
          </span>
        </div>
      </Link>

      {/* Nav links */}
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: location.pathname === l.to ? 'var(--accent)' : 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color 0.2s',
            padding: '4px 8px',
            borderRadius: 6,
            background: location.pathname === l.to ? 'var(--accent-dim)' : 'transparent',
          }}
        >
          {l.label}
        </Link>
      ))}

      {/* Right side */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4aa, #6ee7b7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: user.role === 'admin' ? '1rem' : '0.75rem', 
              fontWeight: 800, color: '#0a0f1e',
            }}>
              {user.role === 'admin' ? 'A' : user.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: 999,
                ...roleStyle,
              }}>
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Sign out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      )}
    </nav>
  );
}
