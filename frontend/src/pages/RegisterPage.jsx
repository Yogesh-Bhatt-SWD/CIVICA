import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'citizen',   label: 'Citizen',   desc: 'Report and upvote civic issues',         icon: '' },
  { value: 'authority', label: 'Authority',  desc: 'Manage and resolve reported issues',      icon: '' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Account created! Welcome, ${user.name} 🎉`);
      if (user.role === 'authority') navigate('/authority');
      else navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      const errMsg = err.response?.data?.error || err.message || 'Registration failed';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 40% 60%, rgba(59,130,246,0.06) 0%, transparent 60%), var(--bg-primary)',
    }}>
      <div style={{
        position: 'fixed', top: '30%', right: '25%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 460, animation: 'slideUp 0.35s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #00d4aa, #6ee7b7)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 8px 32px rgba(0,212,170,0.25)',
            }}>A</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Civica</span>
          </Link>
          <h2 style={{ marginTop: 20, marginBottom: 6, fontSize: '1.5rem' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join the civic accountability movement</p>
        </div>

        <div className="card" style={{
          padding: 32,
          background: 'rgba(255,255,255,0.035)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Role Selector */}
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `2px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.role === r.value ? 'var(--accent-dim)' : 'var(--bg-card)',
                      color: form.role === r.value ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="reg-name"
                className="form-control"
                placeholder="Your full name"
                value={form.name}
                onChange={set('name')}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="reg-email"
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
                  id="reg-password"
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4].map((i) => {
                      const strength = form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : form.password.length < 14 ? 3 : 4;
                      const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#00d4aa'];
                      return (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength] : 'var(--border)', transition: 'all 0.3s' }} />
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {form.password.length < 6 ? 'Too weak' : form.password.length < 10 ? 'Fair' : form.password.length < 14 ? 'Good' : 'Strong'}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm-password"
                  className="form-control"
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowConfirmPass((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                  {showConfirmPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>Passwords do not match</div>
              )}
            </div>

            <button
              id="reg-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 6, padding: '13px', fontSize: '0.95rem', justifyContent: 'center', borderRadius: 10 }}
            >
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
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
            id="google-register-btn"
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
            Sign up with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
