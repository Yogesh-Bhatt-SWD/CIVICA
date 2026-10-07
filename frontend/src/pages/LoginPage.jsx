import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'authority') navigate('/authority');
      else navigate('/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      if (!err.response) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/oauth2/authorization/google';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(0,212,170,0.06) 0%, transparent 60%), var(--bg-primary)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.35s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #00d4aa, #6ee7b7)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 8px 32px rgba(0,212,170,0.25)',
            }}>A</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Civica
            </span>
          </Link>
          <h2 style={{ marginTop: 20, marginBottom: 6, fontSize: '1.5rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card" style={{
          padding: 32,
          background: 'rgba(255,255,255,0.035)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                className="form-control"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1rem',
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 6, padding: '13px', fontSize: '0.95rem', justifyContent: 'center', borderRadius: 10 }}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          {/* OAuth Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '22px 0 18px 0',
            gap: 12,
            color: 'var(--text-muted, #71717a)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google Button */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.92rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text-primary, #fff)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.26 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.39-1.5-.39-2.24s.14-1.52.39-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.74 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: 20,
          padding: '14px 18px',
          background: 'rgba(0,212,170,0.06)',
          border: '1px solid rgba(0,212,170,0.15)',
          borderRadius: 10,
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          💡 <strong style={{ color: 'var(--text-primary)' }}>First time?</strong> Register a free Citizen account,
          or ask your admin to grant Authority / Admin access.
        </div>
      </div>
    </div>
  );
}
