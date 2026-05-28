const STATUS_CONFIG = {
  pending:      { label: 'Pending',      bg: 'var(--amber-dim)',  color: 'var(--amber)', icon: '' },
  in_progress:  { label: 'In Progress',  bg: 'var(--blue-dim)',   color: 'var(--blue)',  icon: '' },
  resolved:     { label: 'Resolved',     bg: 'var(--accent-dim)', color: 'var(--accent)',icon: '' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: `1px solid ${cfg.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
