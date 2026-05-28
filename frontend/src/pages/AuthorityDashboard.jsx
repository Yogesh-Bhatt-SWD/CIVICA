import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import GravityBadge from '../components/GravityBadge';
import StatusBadge from '../components/StatusBadge';
import Logo from '../components/Logo';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  pothole:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 108 0 4 4 0 10-8 0"/></svg>,
  road_crack: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 1l-1 4h5l-1 4h5l-1 4h5l-1 4h-5l1-4h-5l1-4h-5l1-4h-5l1-4z"/></svg>,
  open_manhole: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>,
};
const CATEGORY_LABELS = { pothole: 'Potholes', road_crack: 'Road cracks', open_manhole: 'Open Manhole' };
const CATEGORIES = Object.keys(CATEGORY_LABELS);

function ResolveModal({ report, onClose, onDone }) {
  const [status, setStatus] = useState('in_progress');
  const [note, setNote] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/authority/reports/${report._id}/status`, { 
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

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Update Report Status</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{
          padding: '12px 14px', marginBottom: 18,
          background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            {CATEGORY_ICONS[report.category]} {report.title}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <StatusBadge status={report.status} />
            <GravityBadge score={report.gravityScore} />
          </div>
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
              placeholder="Describe what action was taken..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? <><span className="spinner" /> Updating…</> : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuthorityDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      const res = await api.get('/authority/reports', { params });
      setReports(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="page" style={{ paddingTop: 92 }}>
        {/* Main Logo Branding */}
        <Logo style={{ maxWidth: 300, margin: '0 0 20px 0', padding: 0, justifyContent: 'flex-start' }} />

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="accent-line" />
            <h1>Issue Queue</h1>
            <p style={{ marginTop: 6 }}>
              Active civic issues sorted by gravity score — resolve the most critical first.
            </p>
          </div>
          <div style={{
            padding: '10px 20px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: 10,
            textAlign: 'center',
            minWidth: 100,
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Active Issues</div>
          </div>
        </div>

        {/* Report Grid */}

        {/* Report Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>All clear!</h3>
            <p>No active issues in the queue right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {reports.map((report) => {
              const [lng, lat] = report.location?.coordinates || [0, 0];
              return (
                <div key={report._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
                  {/* Gravity accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: report.gravityScore >= 75 ? '#ef4444' : report.gravityScore >= 50 ? '#f59e0b' : report.gravityScore >= 25 ? '#3b82f6' : '#94a3b8',
                  }} />

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>{CATEGORY_ICONS[report.category]}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {report.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {CATEGORY_LABELS[report.category]} · {timeAgo(report.createdAt)}
                        </div>
                      </div>
                    </div>
                    <GravityBadge score={report.gravityScore} />
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {report.description.slice(0, 100)}{report.description.length > 100 ? '…' : ''}
                    </p>
                  )}

                  {/* Image */}
                  {report.imageUrl && (
                    <img src={report.imageUrl} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={report.status} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                      {report.upvotes}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Sev {report.severity}/5
                    </span>
                    {report.aiValidated && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.25)' }}>Authority Verified</span>
                    )}
                  </div>

                  {/* Address */}
                  {report.address && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {report.address}
                    </div>
                  )}

                  {/* Reporter */}
                  {report.submittedBy && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {report.submittedBy.name?.[0]?.toUpperCase()}
                      </div>
                      {report.submittedBy.name}
                    </div>
                  )}

                  {/* Divider + Actions */}
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <a
                      href={`https://maps.google.com/?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', gap: 6 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="6" x2="16" y2="22" />
                      </svg>
                      View Map
                    </a>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 2, justifyContent: 'center', gap: 8 }}
                      onClick={() => setSelectedReport(report)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Update Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: 32 }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </main>

      {/* Status Update Modal */}
      {selectedReport && (
        <ResolveModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDone={fetchReports}
        />
      )}
    </div>
  );
}
