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
