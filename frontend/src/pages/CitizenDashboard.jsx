import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import ReportCard from '../components/ReportCard';
import ReportForm from '../components/ReportForm';
import Logo from '../components/Logo';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['pothole', 'road_crack', 'open_manhole'];
const STATUSES   = ['pending', 'in_progress', 'resolved'];
const CAT_LABELS = { pothole: 'Potholes', road_crack: 'Road cracks', open_manhole: 'Open Manhole' };
const STA_LABELS = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };

export default function CitizenDashboard() {
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mapClickLoc, setMapClickLoc] = useState(null);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch ALL reports for the map
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      const res = await api.get('/reports', { params });
      setReports(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch current user's reports
  const fetchMine = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await api.get('/reports/my', { params: { page, limit: 8 } });
      setMyReports(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setMyLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchMine(); }, [fetchMine]);

  const handleMapClick = (latlng) => {
    setMapClickLoc(latlng);
    setShowForm(true);
  };

  const handleUpvote = async (id) => {
    try {
      await api.patch(`/reports/${id}/upvote`);
      toast.success('Upvoted!');
      fetchAll();
    } catch (e) {
      toast.error('Failed to upvote');
    }
  };

  const handleFormSuccess = () => {
    fetchAll();
    fetchMine();
    setMapClickLoc(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 0,
        height: 'calc(100vh - 64px)',
        marginTop: 64,
      }}>
        {/* ── LEFT: Map ── */}
        <div style={{ position: 'relative', height: '100%' }}>

          {/* Map Hint */}
          <div style={{
            position: 'absolute', bottom: 20, left: 12, zIndex: 500,
            background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '8px 14px', fontSize: '0.78rem', color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 12h-3m0 0H9m3 0V9m0 3v3m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click on map to report a new issue
            </div>
          </div>

          <MapView
            reports={reports}
            onMapClick={handleMapClick}
            selectedLocation={mapClickLoc}
            onUpvote={handleUpvote}
          />
        </div>

        {/* ── RIGHT: Reports Panel ── */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          {/* Panel Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <Logo style={{ maxWidth: 220, marginBottom: 16, padding: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reports</h2>
              <button
                id="open-report-form"
                className="btn btn-primary btn-sm"
                onClick={() => setShowForm(true)}
              >
                + New Report
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'all',  label: `All (${reports.length})` },
                { key: 'mine', label: `Mine (${myReports.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 8,
                    border: `1px solid ${tab === t.key ? 'var(--accent)' : 'var(--border)'}`,
                    background: tab === t.key ? 'var(--accent-dim)' : 'transparent',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tab === 'all' ? (
              loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                  <div className="spinner spinner-lg" />
                </div>
              ) : reports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                  </div>
                  <h3 style={{ marginTop: 16 }}>No reports yet</h3>
                  <p>Be the first to report an issue in your area.</p>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
                    + Report an Issue
                  </button>
                </div>
              ) : (
                reports.map((r) => (
                  <ReportCard key={r._id} report={r} onUpdate={fetchAll} actionType="citizen" />
                ))
              )
            ) : (
              myLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                  <div className="spinner spinner-lg" />
                </div>
              ) : myReports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h3 style={{ marginTop: 16 }}>No reports yet</h3>
                  <p>You haven&apos;t reported any issues yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
                    + Report Your First Issue
                  </button>
                </div>
              ) : (
                <>
                  {myReports.map((r) => (
                    <ReportCard key={r._id} report={r} onUpdate={() => { fetchAll(); fetchMine(); }} actionType="citizen" />
                  ))}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                      <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      {showForm && (
        <ReportForm
          onClose={() => { setShowForm(false); setMapClickLoc(null); }}
          onSuccess={handleFormSuccess}
          defaultLocation={mapClickLoc}
          onLocationDetected={setMapClickLoc}
        />
      )}
    </div>
  );
}
