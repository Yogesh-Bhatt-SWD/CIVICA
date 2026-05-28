import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GravityBadge from './GravityBadge';
import StatusBadge from './StatusBadge';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';
import ReportPDF from './ReportPDF';

const CATEGORY_ICONS = {
  pothole:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 108 0 4 4 0 10-8 0"/></svg>,
  garbage:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  road_crack: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 1l-1 4h5l-1 4h5l-1 4h5l-1 4h-5l1-4h-5l1-4h-5l1-4h-5l1-4z"/></svg>,
  flooding:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>,
  open_manhole: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>,
  other:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
};

const CATEGORY_LABELS = {
  pothole: 'Pothole', garbage: 'Garbage', road_crack: 'Road Crack', flooding: 'Flooding', open_manhole: 'Open Manhole', other: 'Other'
};

export default function ReportCard({ report, onUpdate, showActions = false, actionType = 'citizen' }) {
  const { user } = useAuth();
  const [loadingUpvote, setLoadingUpvote] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const hasUpvoted = report.upvotedBy?.includes(user?.id);

  const handleUpvote = async () => {
    if (loadingUpvote) return;
    setLoadingUpvote(true);
    try {
      await api.patch(`/reports/${report._id}/upvote`);
      toast.success(hasUpvoted ? 'Upvote removed' : 'Upvoted');
      onUpdate?.();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to upvote');
    } finally {
      setLoadingUpvote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this report?')) return;
    setLoadingDelete(true);
    try {
      await api.delete(`/reports/${report._id}`);
      toast.success('Report deleted');
      onUpdate?.();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete');
    } finally {
      setLoadingDelete(false);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };


  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>{CATEGORY_ICONS[report.category] || CATEGORY_ICONS.other}</span>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {report.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {CATEGORY_LABELS[report.category]} · {timeAgo(report.createdAt)}
            </div>
          </div>
        </div>
        <GravityBadge score={report.gravityScore} />
      </div>

      {/* Description */}
      {report.description && (
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {report.description.length > 120 ? report.description.slice(0, 120) + '…' : report.description}
        </p>
      )}

      {/* Image with Bounding Box Overlay */}
      {report.imageUrl && (
        <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={report.imageUrl}
            alt="Report"
            style={{ width: '100%', height: showActions ? 140 : 280, objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
          {report.aiBoundingBox && report.aiBoundingBox.length === 4 && (
            <div
              style={{
                position: 'absolute',
                top: `${report.aiBoundingBox[1] * 100}%`,
                left: `${report.aiBoundingBox[0] * 100}%`,
                width: `${(report.aiBoundingBox[2] - report.aiBoundingBox[0]) * 100}%`,
                height: `${(report.aiBoundingBox[3] - report.aiBoundingBox[1]) * 100}%`,
                border: '2px dashed var(--accent)',
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                boxShadow: '0 0 10px rgba(0, 212, 170, 0.3)',
                pointerEvents: 'none',
              }}
            >
              <div style={{
                position: 'absolute', top: -20, left: -2, background: 'var(--accent)', color: '#000',
                fontSize: '0.65rem', padding: '2px 8px', fontWeight: 800, borderRadius: '4px 4px 4px 0',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {report.category?.replace('_', ' ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {(report.address || report.state) && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {report.address}{report.address && report.state ? ', ' : ''}{report.state}
        </div>
      )}

      {/* ETA */}
      {report.status === 'in_progress' && report.estimatedDays && (
        <div style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600, display: 'flex', gap: 4, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Estimated ETA: {report.estimatedDays} day{report.estimatedDays !== 1 ? 's' : ''}
        </div>
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
        
        <div style={{ flex: 1 }} />
        
        {user?.role === 'authority' && (
          <button 
            className="btn btn-ghost btn-sm no-print" 
            onClick={() => window.print()}
            style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            PDF
          </button>
        )}
      </div>

      {/* Hidden Printable Report */}
      <ReportPDF report={report} />

      {/* Footer Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          {/* Upvote */}
          <button
            className={`upvote-btn ${hasUpvoted ? 'voted' : ''}`}
            onClick={handleUpvote}
            disabled={loadingUpvote}
            title={hasUpvoted ? 'Remove upvote' : 'Upvote'}
          >
            {loadingUpvote ? <span className="spinner" style={{ width: 12, height: 12 }} /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            )}
            <span style={{ fontSize: '0.8rem' }}>{report.upvotes}</span>
          </button>

          {/* Citizen delete own report */}
          {actionType === 'citizen' && String(report.submittedBy?._id || report.submittedBy) === user?.id && (
            <button
              className="btn-icon"
              onClick={handleDelete}
              disabled={loadingDelete}
              title="Delete report"
              style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)', background: 'var(--red-dim)' }}
            >
              {loadingDelete ? <span className="spinner" style={{ width: 12, height: 12 }} /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9v-4m4 4v-4" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Assigned to */}
      {report.assignedTo && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Assigned to: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{report.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}
