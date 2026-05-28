import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AnalyticsCharts from '../components/AnalyticsCharts';
import ReportCard from '../components/ReportCard';
import StatusBadge from '../components/StatusBadge';
import Logo from '../components/Logo';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';
import MapView from '../components/MapView';

const ROLE_OPTIONS = ['citizen', 'authority', 'admin'];
const ROLE_COLORS = {
  citizen:   { bg: 'var(--accent-dim)',        color: 'var(--accent)' },
  authority: { bg: 'var(--blue-dim)',           color: 'var(--blue)' },
  admin:     { bg: 'rgba(168,85,247,.15)',      color: '#a855f7' },
};

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: accent }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ReportDetailsModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div className="overlay" style={{ zIndex: 9999 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500, width: '90%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--text-primary)' }}>Report Details</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 }}>
          <ReportCard report={report} showActions={false} />
        </div>
      </div>
    </div>
  );
}

function AdminUpdateModal({ report, onClose, onDone }) {
  const [status, setStatus] = useState(report.status === 'pending' ? 'in_progress' : report.status);
  const [note, setNote] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(report.estimatedDays || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/reports/${report._id}/status`, { 
        status, 
        note, 
        estimatedDays: estimatedDays ? Number(estimatedDays) : null 
      });
      toast.success(`Report marked as ${status.replace('_', ' ')}`);
      onDone?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <div className="overlay" style={{ zIndex: 9999 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Update Report Status</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'in_progress', label: 'In Progress', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, color: 'var(--blue)' },
                { value: 'resolved', label: 'Resolved', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, color: 'var(--accent)' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  style={{
                    padding: '12px', borderRadius: 10,
                    border: `2px solid ${status === s.value ? s.color : 'var(--border)'}`,
                    background: status === s.value ? `${s.color}18` : 'var(--bg-card)',
                    color: status === s.value ? s.color : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {status === 'in_progress' && (
            <div className="form-group">
              <label className="form-label">Estimated Days to Resolve</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 3"
                min="1"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Resolution Note (optional)</label>
            <textarea
              className="form-control"
              placeholder="Internal resolution notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [updatingRole, setUpdatingRole] = useState({});

  const [reports, setReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [viewingReport, setViewingReport] = useState(null);
  const [updatingReport, setUpdatingReport] = useState(null);
  
  const [mapReports, setMapReports] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  // Fetch analytics
  useEffect(() => {
    api.get('/admin/analytics')
      .then((res) => setAnalytics(res.data.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  // Fetch users
  useEffect(() => {
    setUsersLoading(true);
    const params = { page: userPage, limit: 15 };
    if (userRoleFilter) params.role = userRoleFilter;
    api.get('/admin/users', { params })
      .then((res) => {
        setUsers(res.data.data || []);
        setUsersTotal(res.data.pagination?.total || 0);
        setUserTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setUsersLoading(false));
  }, [userPage, userRoleFilter]);

  // Fetch reports
  const fetchReports = () => {
    setReportsLoading(true);
    const params = { page: reportPage, limit: 15 };
    if (reportStatusFilter) params.status = reportStatusFilter;
    api.get('/reports', { params })
      .then((res) => {
        setReports(res.data.data || []);
        setReportsTotal(res.data.pagination?.total || 0);
        setReportTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setReportsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
    if (activeTab === 'map') {
      fetchMapReports();
    }
  }, [activeTab, reportPage, reportStatusFilter]);

  const fetchMapReports = () => {
    setMapLoading(true);
    // Fetch a large number of reports for the map (active ones primarily)
    api.get('/reports', { params: { limit: 500, status: 'pending,in_progress' } })
      .then((res) => setMapReports(res.data.data || []))
      .catch(() => toast.error('Failed to load map data'))
      .finally(() => setMapLoading(false));
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole((p) => ({ ...p, [userId]: true }));
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdatingRole((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setUsersTotal((t) => t - 1);
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const filteredUsers = userSearch
    ? users.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const timeAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="page" style={{ paddingTop: 92 }}>
        
        {/* Main Logo Branding */}
        <Logo style={{ maxWidth: 350, margin: '0 0 20px 0', padding: 0, justifyContent: 'flex-start' }} />

        {/* Header */}
        <div className="page-header">
          <div className="accent-line" />
          <h1>Civic Authority Panel</h1>
          <p>Official Infrastructure Oversight, System Analytics, and Case Resolution.</p>
        </div>

        {/* Stats Row */}
        {analyticsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div className="grid-4" style={{ marginBottom: 32 }}>
            <StatCard 
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
              value={analytics?.totalReports} label="Total Reports" accent="#00d4aa" 
            />
            <StatCard 
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              value={analytics?.pendingCount} label="Pending" accent="#f59e0b" 
            />
            <StatCard 
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>}
              value={analytics?.inProgressCount} label="In Progress" accent="#3b82f6" 
            />
            <StatCard 
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              value={analytics?.resolvedCount} label="Resolved" accent="#84cc16" 
            />
          </div>
        )}

        {/* Resolution Time */}
        {analytics?.avgResolutionTime !== undefined && (
          <div style={{
            marginBottom: 32,
            padding: '16px 24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--amber)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                {analytics.avgResolutionTime} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>days</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Resolution Time
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {!analyticsLoading && analytics && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 20, color: 'var(--text-primary)' }}>Platform Analytics</h2>
            <AnalyticsCharts data={analytics} />
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <button
            style={{
              background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
              color: activeTab === 'users' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'users' ? '3px solid var(--accent)' : '3px solid transparent',
              fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
            }}
            onClick={() => setActiveTab('users')}
          >
            Users Management
          </button>
          <button
            style={{
              background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
              color: activeTab === 'reports' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'reports' ? '3px solid var(--accent)' : '3px solid transparent',
              fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
            }}
            onClick={() => setActiveTab('reports')}
          >
            Reports Pipeline
          </button>
          <button
            style={{
              background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
              color: activeTab === 'map' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'map' ? '3px solid var(--accent)' : '3px solid transparent',
              fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
            }}
            onClick={() => setActiveTab('map')}
          >
            Infrastructure Map
          </button>
        </div>

        {activeTab === 'users' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                User Management
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 10 }}>({usersTotal} total)</span>
              </h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="form-control"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ maxWidth: 200, fontSize: '0.85rem' }}
                />
                <select
                  className="form-control"
                  style={{ maxWidth: 150, fontSize: '0.85rem' }}
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                >
                  <option value="">All Roles</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                        <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const roleStyle = ROLE_COLORS[user.role] || {};
                      return (
                        <tr key={user._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00d4aa, #6ee7b7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 800, color: '#0a0f1e', flexShrink: 0,
                              }}>
                                {user.name?.[0]?.toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.email}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: 999,
                              fontSize: '0.72rem', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                              ...roleStyle,
                            }}>{user.role}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{timeAgo(user.createdAt)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(user._id, user.name)}
                                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9v-4m4 4v-4" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            {userTotalPages > 1 && (
              <div className="pagination" style={{ marginTop: 20 }}>
                <button className="page-btn" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length: Math.min(userTotalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${userPage === p ? 'active' : ''}`} onClick={() => setUserPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={userPage === userTotalPages} onClick={() => setUserPage(p => p + 1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'reports' ? (
          <div>
            {/* Reports Management Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Reports Pipeline
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 10 }}>({reportsTotal} total)</span>
              </h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-control"
                  style={{ maxWidth: 150, fontSize: '0.85rem' }}
                  value={reportStatusFilter}
                  onChange={(e) => { setReportStatusFilter(e.target.value); setReportPage(1); }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-lg" style={{ margin: '0 auto' }} /></td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reports found</td>
                    </tr>
                  ) : (
                    reports.map(r => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          <div style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.title}>
                            {r.title}
                          </div>
                        </td>
                        <td><span style={{ fontSize: '0.85rem' }}>{r.category.replace('_', ' ')}</span></td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }} title={r.address || 'Location unknown'}>
                          {r.address || '—'}
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.submittedBy?.name || 'Unknown'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={async () => {
                                try {
                                  toast.success('Compiling official PDF document...');
                                  const response = await api.get(`/reports/${r._id}/pdf`, { responseType: 'blob' });
                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `Civica_Report_${r._id}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.parentNode.removeChild(link);
                                } catch (e) {
                                  toast.error('Failed to generate PDF');
                                }
                              }} 
                              title="Download Report PDF"
                              style={{ color: 'var(--accent)', borderColor: 'rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.05)', display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              PDF
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => setViewingReport(r)} 
                              title="View Detail"
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View
                            </button>
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => setUpdatingReport(r)} 
                              title="Update Status"
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              Update
                            </button>
                             <button className="btn btn-danger btn-sm" onClick={async () => {
                              if(confirm('Delete report?')){
                                try {
                                  await api.delete(`/reports/${r._id}`);
                                  fetchReports();
                                  toast.success('Report deleted');
                                } catch (err) {
                                  toast.error('Failed to delete');
                                }
                              }
                            }} title="Delete" style={{ padding: '6px' }}>
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9v-4m4 4v-4" />
                               </svg>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {reportTotalPages > 1 && (
              <div className="pagination" style={{ marginTop: 20 }}>
                <button className="page-btn" disabled={reportPage === 1} onClick={() => setReportPage(p => p - 1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length: Math.min(reportTotalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${reportPage === p ? 'active' : ''}`} onClick={() => setReportPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={reportPage === reportTotalPages} onClick={() => setReportPage(p => p + 1)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'map' ? (
          <div style={{ height: 'calc(100vh - 350px)', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Geospatial Oversight
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 10 }}>({mapReports.length} issues visualized)</span>
              </h2>
              {mapLoading && <div className="spinner spinner-sm" />}
            </div>
            <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
              <MapView reports={mapReports} onViewReport={(r) => setViewingReport(r)} />
            </div>
          </div>
        ) : null}
      </main>

      {viewingReport && (
        <ReportDetailsModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      {updatingReport && (
        <AdminUpdateModal 
          report={updatingReport} 
          onClose={() => setUpdatingReport(null)} 
          onDone={fetchReports} 
        />
      )}

      {/* Footer Branding */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '32px 24px', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border)', 
        color: 'var(--text-muted)', 
        fontSize: '0.85rem', 
        fontWeight: 500,
        background: 'var(--bg-card)'
      }}>
        © Civica Civic Authority Panel
      </footer>
    </div>
  );
}
