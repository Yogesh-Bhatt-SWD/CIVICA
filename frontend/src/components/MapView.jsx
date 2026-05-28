import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GravityBadge from './GravityBadge';
import StatusBadge from './StatusBadge';

const STATUS_COLORS = {
  pending:     '#f59e0b', // Amber
  in_progress: '#3b82f6', // Blue
  resolved:    '#00d4aa', // Teal
};

const CATEGORY_ICONS = {
  pothole: '●', road_crack: '/', open_manhole: '○'
};

function MapLegend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 12,
      zIndex: 500,
      background: 'rgba(10,15,30,0.85)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        Map Legend
      </div>
      {Object.entries(STATUS_COLORS).map(([status, color]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '1px solid rgba(255,255,255,0.2)' }} />
          <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );
}

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng);
    },
  });
  return null;
}

function DynamicMarker({ location }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([location.lat, location.lng], 16, { duration: 1.5 });
  }, [location, map]);

  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={10}
      pathOptions={{ color: '#00d4aa', fillColor: '#00d4aa', fillOpacity: 0.6, weight: 2 }}
      eventHandlers={{
        click: () => {
          if (map.getZoom() > 10) {
            map.flyTo([location.lat, location.lng], 5, { duration: 1.5 }); // zoom out
          } else {
            map.flyTo([location.lat, location.lng], 16, { duration: 1.5 }); // zoom in
          }
        }
      }}
    >
      <Popup>GPS / Selected location (Click to zoom out/in)</Popup>
    </CircleMarker>
  );
}

export default function MapView({ reports = [], onMapClick, selectedLocation, onUpvote, onViewReport }) {
  const [hoveredStateName, setHoveredStateName] = useState(null);

  const center = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : [20.5937, 78.9629]; // India center

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={selectedLocation ? 16 : 5}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {onMapClick && <LocationPicker onPick={onMapClick} />}

        {/* Selected location marker */}
        {selectedLocation && <DynamicMarker location={selectedLocation} />}

        {/* Report markers */}
        {reports.map((report) => {
          const [lng, lat] = report.location?.coordinates || [0, 0];
          if (!lat || !lng) return null;
          
          // Use status-based color instead of category-based
          const color = STATUS_COLORS[report.status] || '#94a3b8';
          const isFromHoveredState = hoveredStateName && report.state === hoveredStateName;
          
          // Pending and In-Progress are fully opaque, Resolved is semi-transparent
          const fillOpacity = report.status === 'resolved' ? 0.25 : 0.85;
          const radius = 6 + Math.min((report.gravityScore || 0) / 10, 10);

          return (
            <CircleMarker
              key={report._id}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: isFromHoveredState ? 'white' : color,
                fillColor: color,
                fillOpacity,
                weight: isFromHoveredState ? 3 : 1.5,
              }}
              eventHandlers={{
                mouseover: () => report.state && setHoveredStateName(report.state),
                mouseout: () => setHoveredStateName(null),
              }}
            >
              <Popup maxWidth={280}>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span>{CATEGORY_ICONS[report.category]}</span>
                    <div>
                         <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {report.state || 'Local Area'}
                         </div>
                         <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{report.title}</strong>
                    </div>
                  </div>
                  {report.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {report.description.slice(0, 100)}{report.description.length > 100 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <StatusBadge status={report.status} />
                    <GravityBadge score={report.gravityScore} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Upvotes: {report.upvotes}</span>
                    <span>Sev: {report.severity}/5</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {onUpvote && (
                      <button
                        onClick={() => onUpvote(report._id)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'var(--accent-dim)',
                          border: '1px solid rgba(0,212,170,0.3)',
                          color: 'var(--accent)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        Upvote
                      </button>
                    )}
                    {(onViewReport || onMapClick) && (
                      <button
                        onClick={() => onViewReport ? onViewReport(report) : onMapClick?.({ lat, lng })}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {onViewReport ? 'Details' : 'Center'}
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
