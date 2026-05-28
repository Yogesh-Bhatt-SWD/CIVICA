export default function GravityBadge({ score }) {
  const getColor = (s) => {
    if (s >= 75) return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Critical' };
    if (s >= 50) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'High' };
    if (s >= 25) return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Medium' };
    return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', label: 'Low' };
  };

  const { bg, color, label } = getColor(score ?? 0);

  return (
    <span
      title={`Gravity Score: ${score?.toFixed(1) ?? 0}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: `1px solid ${color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      ⚡ {score?.toFixed(0) ?? 0} · {label}
    </span>
  );
}
