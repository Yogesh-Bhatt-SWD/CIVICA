import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Google sign-in failed: ${error}`);
      navigate('/login', { replace: true });
      return;
    }

    if (!token) {
      toast.error('No authentication token received.');
      navigate('/login', { replace: true });
      return;
    }

    const processLogin = async () => {
      try {
        const user = await loginWithToken(token);
        toast.success(`Welcome back, ${user.name || 'Citizen'}! 👋`);
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'authority') navigate('/authority', { replace: true });
        else navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Failed to complete Google OAuth login:', err);
        toast.error('Failed to finalize login with server.');
        navigate('/login', { replace: true });
      }
    };

    processLogin();
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(0,212,170,0.06) 0%, transparent 60%), var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <div style={{
        padding: '36px 44px',
        background: 'rgba(255,255,255,0.035)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        maxWidth: 400,
        width: '100%',
      }}>
        <div style={{
          width: 52,
          height: 52,
          margin: '0 auto 20px auto',
          borderRadius: '50%',
          border: '3px solid rgba(0,212,170,0.2)',
          borderTopColor: 'var(--accent, #00d4aa)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Authenticating with Google
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Finalizing your session, please wait…
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
