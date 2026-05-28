import StatusBadge from './StatusBadge';
import GravityBadge from './GravityBadge';

const CATEGORY_LABELS = {
  pothole: 'Pothole', garbage: 'Garbage', road_crack: 'Road Crack', flooding: 'Flooding', open_manhole: 'Open Manhole', other: 'Other'
};

export default function ReportPDF({ report }) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const [lng, lat] = report.location?.coordinates || [0, 0];
  const dateStr = new Date(report.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: true
  });

  return (
    <div className="printable-report" style={{
      display: 'none', // Hidden in normal view, shown in print via CSS
      width: '100%',
      maxWidth: '760px',
      margin: '0 auto',
      padding: '40px',
      background: 'white',
      color: '#1a202c',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── HEADER ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* SVG Building Icon */}
          <div style={{
            width: '48px', height: '48px',
            background: '#0C447C',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#90CDF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, letterSpacing: '0.12em', color: '#0C447C' }}>CIVICA</h1>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CIVIC INFRASTRUCTURE AUTHORITY</div>
            <div style={{ fontSize: '9px', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>OFFICIAL INCIDENT & RESOLUTION DOCUMENT</div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>REPORT ID</div>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#EDF2F7',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#2D3748',
          }}>{report._id.slice(-8).toUpperCase()}</div>
          
          <button onClick={handlePrint} className="no-print" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginTop: '12px', padding: '8px 16px',
            background: '#F7FAFC', border: '1px solid #E2E8F0',
            borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            color: '#4A5568', fontWeight: 600
          }}>
            Download PDF
          </button>
        </div>
      </header>

      {/* ── STATUS BAR ── */}
      <div className="section-card" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        background: '#F8FAFC', border: '0.5px solid #E2E8F0',
        borderRadius: '12px', padding: '16px', marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>CURRENT STATUS</div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', background: '#C6F6D5', color: '#22543D',
            borderRadius: '999px', fontSize: '11px', fontWeight: 700
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38A169' }} />
            {report.status === 'resolved' ? 'Resolved' : 'In Progress'}
          </div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '0.5px solid #E2E8F0', borderRight: '0.5px solid #E2E8F0' }}>
          <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>PRIORITY LEVEL</div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', background: '#FED7D7', color: '#822727',
            borderRadius: '999px', fontSize: '11px', fontWeight: 700
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E53E3E' }} />
            {report.gravityScore >= 70 ? 'Critical / High' : report.gravityScore >= 40 ? 'Medium' : 'Low'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>INCIDENT CATEGORY</div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', background: '#EBF8FF', color: '#2C5282',
            borderRadius: '999px', fontSize: '11px', fontWeight: 700
          }}>
            {CATEGORY_LABELS[report.category] || 'General'}
          </div>
        </div>
      </div>

      {/* ── HANDLER ROW ── */}
      <div className="section-card" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '0 16px', marginBottom: '32px'
      }}>
        <div>
          <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>HANDLED BY</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D3748' }}>Vikram Singh</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>DEPARTMENT</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D3748' }}>Civic Maintenance</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>REPORTER</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D3748' }}>{report.submittedBy?.name || 'Arjun Mehra'}</div>
        </div>
      </div>

      {/* ── INCIDENT DETAILS ── */}
      <div className="section-card" style={{
        border: '0.5px solid #E2E8F0', borderRadius: '12px', padding: '20px', marginBottom: '24px'
      }}>
        <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>INCIDENT DETAILS</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A202C', margin: '0 0 12px 0' }}>{report.title}</h2>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#4A5568', margin: 0 }}>
          {report.description || 'No description provided.'}
        </p>
      </div>

      {/* ── BODY GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Location */}
        <div className="section-card" style={{ border: '0.5px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '16px' }}>LOCATION & SPATIAL DATA</div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>Physical Address</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D3748' }}>{report.address || 'Not specified'}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>State</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D3748' }}>{report.state || 'Delhi'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>Geographic Coordinates</div>
            <a href={`https://maps.google.com/?q=${lat},${lng}`} style={{
              fontSize: '13px', fontFamily: 'monospace', color: '#3182CE', textDecoration: 'none'
            }}>
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </a>
          </div>
        </div>

        {/* Right: Management & Timeline */}
        <div className="section-card" style={{ border: '0.5px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '10px', color: '#A0AEC0', textTransform: 'uppercase', fontWeight: 700, marginBottom: '16px' }}>MANAGEMENT & TIMELINE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '4px', width: '1px', background: '#E2E8F0' }} />
            
            <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#38A169', marginTop: '4px', border: '2px solid white', zIndex: 1 }} />
              <div>
                <div style={{ fontSize: '13px', color: '#2D3748' }}>Reported: {dateStr}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#38A169', marginTop: '4px', border: '2px solid white', zIndex: 1 }} />
              <div>
                <div style={{ fontSize: '13px', color: '#2D3748' }}>Assigned to authority: Vikram Singh</div>
                <div style={{ fontSize: '11px', color: '#718096' }}>Civic Maintenance</div>
              </div>
            </div>

            {report.status === 'resolved' && (
              <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#38A169', marginTop: '4px', border: '2px solid white', zIndex: 1 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#38A169' }}>Resolution confirmed</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A0AEC0' }}>
        <div>This is an official document generated by the Civic Infrastructure Authority.</div>
        <div>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </footer>
    </div>
  );
}
