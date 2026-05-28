import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user) {
    // Check if there's a token in storage; if so, we might be in the middle of a state update
    const hasToken = localStorage.getItem('civica_token');
    if (hasToken) return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    // Redirect to the right dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'authority') return <Navigate to="/authority" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
