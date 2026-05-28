import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const CATEGORY_COLORS = {
  pothole: '#f97316', garbage: '#84cc16', road_crack: '#8b5cf6',
  flooding: '#3b82f6', other: '#94a3b8',
};
const STATUS_COLORS = {
  pending: '#f59e0b', in_progress: '#3b82f6', resolved: '#00d4aa',
};

const CUSTOM_TOOLTIP_STYLE = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#f1f5f9',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.82rem',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      <strong style={{ color: payload[0].fill }}>{payload[0].name}</strong>
      <div>Count: <strong>{payload[0].value}</strong></div>
    </div>
  );
}

export default function AnalyticsCharts({ data }) {
  if (!data) return null;

  const { reportsByCategory = [], reportsByStatus = [], topReportedAreas = [] } = data;

  const categoryData = reportsByCategory.map((d) => ({
    name: d.category?.replace('_', ' ') || 'Unknown',
    value: d.count,
    rawKey: d.category,
  }));

  const statusData = reportsByStatus.map((d) => ({
    name: d.status?.replace('_', ' ') || 'Unknown',
    count: d.count,
    rawKey: d.status,
  }));

  const areaData = topReportedAreas.slice(0, 5).map((d) => ({
    name: d.address?.slice(0, 24) || 'Unknown',
    reports: d.count,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Row 1: Pie + Bar side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Category Pie */}
        <div className="card card-lg">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Issues by Category
          </h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.rawKey] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {categoryData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[d.rawKey] || '#94a3b8' }} />
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{d.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📊</div>
              <p>No data yet</p>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="card card-lg">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Issues by Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.replace('_', ' ')}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.rawKey] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📊</div>
              <p>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Top Areas */}
      {areaData.length > 0 && (
        <div className="card card-lg">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top Reported Areas
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={areaData} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="reports" name="Reports" fill="#00d4aa" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
