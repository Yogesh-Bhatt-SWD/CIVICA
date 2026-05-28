import { useState, useEffect } from 'react';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';

const SEVERITY_LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical' };
const SEVERITY_COLORS = { 1: '#94a3b8', 2: '#3b82f6', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444' };

const formatCategoryName = (rawName) => {
  const map = {
    'Potholes and RoadCracks': 'Potholes & Road Cracks',
    'Garbage': 'Garbage',
    'FallenTrees': 'Fallen Trees',
    'DamagedElectricalPoles': 'Damaged Electrical Poles'
  };
  return map[rawName] || rawName;
};

function BoundingBoxOverlay({ box, label, confidence }) {
  if (!box || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box;
  
  return (
    <div style={{
      position: 'absolute',
      top: `${ymin * 100}%`,
      left: `${xmin * 100}%`,
      width: `${(xmax - xmin) * 100}%`,
      height: `${(ymax - ymin) * 100}%`,
      border: '2px solid var(--accent)',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(0,212,170,0.5), inset 0 0 5px rgba(0,212,170,0.3)',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        position: 'absolute',
        top: '-24px',
        left: '0',
        backgroundColor: 'var(--accent)',
        color: 'var(--bg-primary)',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '4px 4px 4px 0',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ textTransform: 'uppercase' }}>{label}</span>
        <span style={{ opacity: 0.8 }}>{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function ReportForm({ onClose, onSuccess, defaultLocation, onLocationDetected }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '', // starts empty, populated when loaded
    image: null,
    imagePreview: '',
    severity: 3,
    latitude: defaultLocation?.lat || '',
    longitude: defaultLocation?.lng || '',
    address: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // null | 'checking' | 'ok' | 'fail' | 'offline' | 'low'
  const [aiData, setAiData] = useState(null);
  const [validating, setValidating] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/reports/categories');
        const rawCats = res.data.categories || ['FallenTrees', 'DamagedElectricalPoles', 'Potholes and RoadCracks', 'Garbage'];
        const mappedCats = rawCats.map(c => ({ value: c, label: formatCategoryName(c) }));
        setCategories(mappedCats);
        setForm(f => ({ ...f, category: mappedCats[0]?.value || '' }));
      } catch (err) {
        console.warn('Failed to fetch categories, using fallbacks', err);
        const fb = [
          { value: 'FallenTrees', label: 'Fallen Trees' },
          { value: 'DamagedElectricalPoles', label: 'Damaged Electrical Poles' },
          { value: 'Potholes and RoadCracks', label: 'Potholes & Road Cracks' },
          { value: 'Garbage', label: 'Garbage' }
        ];
        setCategories(fb);
        setForm(f => ({ ...f, category: fb[0].value }));
      }
    };
    fetchCategories();
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const getMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        setLocLoading(false);
        toast.success('Location detected!');
        if (onLocationDetected) onLocationDetected({ lat, lng });
      },
      (err) => { 
        console.error('GPS Error:', err);
        toast.error(`GPS Error: ${err.message}`); 
        setLocLoading(false); 
      }
    );
  };

  const validateUpload = async (file, category) => {
    if (!file) return;
    setValidating(true);
    setAiStatus('checking');
    setAiData(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (category) formData.append('category', category);
      
      const res = await api.post('/reports/validate-image', formData);
      const data = res.data.aiData;
      setAiData(data);
      if (data.valid) {
        setAiStatus('ok');
      } else if (data.low_confidence) {
        setAiStatus('low');
      } else {
        setAiStatus('fail');
      }
      
      if (data.valid) {
        toast.success(`AI Detection: ${data.detected_label || data.category} (${(data.confidence * 100).toFixed(0)}%)`);
      } else {
        toast.error(data.message || 'Validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err.response?.data || err.message);
      const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
      
      if (err.response?.data?.isDown) {
        setAiStatus('offline');
        setAiData({ message: backendError });
      } else {
        setAiStatus('fail');
        setAiData(err.response?.data?.aiData || { message: backendError || 'Cloud AI validation failed.' });
      }
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      return toast.error('Please set a location (use GPS or map click)');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'imagePreview') return;
        if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      
      
      const res = await api.post('/reports', formData);
      
      if (res.data.duplicate) {
        toast.success('Similar issue already reported nearby — your upvote was added!', { duration: 5000 });
      } else {
        toast.success('Report submitted successfully!');
      }
      onSuccess?.(res.data.data);
      onClose?.();
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Submission failed. Please try again.';
      toast.error(msg, { duration: 5000 });
      if (err.response?.data?.aiData) setAiStatus('fail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Report an Issue</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, marginLeft: 46 }}>
              Help your community by documenting civic problems
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.1rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Issue Title *</label>
            <input
              className="form-control"
              placeholder="e.g. Large pothole on MG Road"
              value={form.title}
              onChange={set('title')}
              required
              maxLength={150}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-control" value={form.category} onChange={set('category')} required disabled={categories.length === 0}>
              {categories.length === 0 && <option value="">Loading categories...</option>}
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={set('description')}
              maxLength={1000}
              rows={3}
            />
          </div>

          {/* Severity */}
          <div className="form-group">
            <label className="form-label">
              Severity — <span style={{ color: SEVERITY_COLORS[form.severity] }}>
                {SEVERITY_LABELS[form.severity]}
              </span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, severity: s }))}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: `2px solid ${form.severity === s ? SEVERITY_COLORS[s] : 'var(--border)'}`,
                    background: form.severity === s ? `${SEVERITY_COLORS[s]}20` : 'var(--bg-card)',
                    color: form.severity === s ? SEVERITY_COLORS[s] : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Upload Image *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm(f => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }));
                    validateUpload(file, form.category);
                  } else {
                    setForm(f => ({ ...f, image: null, imagePreview: '' }));
                    setAiData(null);
                    setAiStatus(null);
                  }
                }}
                style={{ padding: '8px' }}
                disabled={validating}
              />
              {validating && (
                <div style={{ position: 'absolute', right: 10, top: 10 }}>
                  <span className="spinner spinner-sm" />
                </div>
              )}
            </div>
            
            {form.imagePreview && (
              <div style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', lineHeight: 0 }}>
                <img
                  src={form.imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain', background: '#050a15' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {!validating && aiData?.boundingBox && (
                  <BoundingBoxOverlay 
                    box={aiData.boundingBox} 
                    label={aiData.detected_label || aiData.category}
                    confidence={aiData.confidence}
                  />
                )}
                {/* Low confidence subtle overlay */}
                {aiStatus === 'low' && (
                  <div style={{ position: 'absolute', inset: 0, border: '2px dashed #f59e0b', borderRadius: 12, pointerEvents: 'none' }} />
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location *</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-control"
                placeholder="Latitude"
                value={form.latitude}
                onChange={set('latitude')}
                type="number"
                step="any"
                style={{ flex: 1 }}
              />
              <input
                className="form-control"
                placeholder="Longitude"
                value={form.longitude}
                onChange={set('longitude')}
                type="number"
                step="any"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={getMyLocation} disabled={locLoading} style={{ whiteSpace: 'nowrap', gap: 6 }}>
                {locLoading ? <span className="spinner" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                )}
                My GPS
              </button>
            </div>
            <input
              className="form-control"
              placeholder="Address / landmark (optional)"
              value={form.address}
              onChange={set('address')}
              style={{ marginBottom: 8 }}
            />
            <input
              className="form-control"
              placeholder="State (e.g. Maharashtra, Karnataka)"
              value={form.state}
              onChange={set('state')}
              required
            />
            {defaultLocation && !form.latitude && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, latitude: defaultLocation.lat.toFixed(6), longitude: defaultLocation.lng.toFixed(6) }))}
                style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0, fontFamily: 'inherit' }}
              >
                Use map-selected location ({defaultLocation.lat.toFixed(4)}, {defaultLocation.lng.toFixed(4)})
              </button>
            )}
          </div>

          {aiStatus === 'low' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>🤔</span>
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: 2 }}>Low Confidence Detection</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {aiData?.message} Please ensure this is the correct category and the photo is clear.
                </div>
              </div>
            </div>
          )}

          {aiStatus === 'fail' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>Attention:</span>
              <div>
                <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem', marginBottom: 2 }}>Detection Issue</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {aiData?.message || "Invalid image for selected category."}
                </div>
              </div>
            </div>
          )}

          {aiStatus === 'offline' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>Connectivity:</span>
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: 2 }}>AI Offline</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  The AI validation service is currently offline. You can still submit your report and an official will review it manually.
                </div>
              </div>
            </div>
          )}

          {/* aiStatus === 'ok' message removed per user request */}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? <><span className="spinner" /> Submitting…</> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
