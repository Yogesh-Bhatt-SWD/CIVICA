import React from 'react';

export default function Logo({ className = '', style = {} }) {
  return (
    <div className={`logo-outer ${className}`} style={style}>
      <svg width="100%" viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <clipPath id="hx">
            <polygon points="135,35 226,88 226,192 135,245 44,192 44,88"/>
          </clipPath>
        </defs>
        
        {/* ── BADGE ── */}
        <polygon className="badge-fill" points="135,35 226,88 226,192 135,245 44,192 44,88"/>
        <polygon className="badge-ring" points="135,49 215,94 215,186 135,231 55,186 55,94"/>
        
        {/* Road surface */}
        <rect className="road-fill" x="121" y="48" width="28" height="190" rx="2" clipPath="url(#hx)"/>
        <line className="road-edge" x1="122" y1="48" x2="122" y2="238" clipPath="url(#hx)"/>
        <line className="road-edge" x1="148" y1="48" x2="148" y2="238" clipPath="url(#hx)"/>
        
        {/* Lane dashes */}
        <rect className="road-dash" x="131" y="66"  width="7" height="14" rx="2" clipPath="url(#hx)"/>
        <rect className="road-dash" x="131" y="95"  width="7" height="14" rx="2" clipPath="url(#hx)"/>
        <rect className="road-dash" x="131" y="124" width="7" height="14" rx="2" clipPath="url(#hx)"/>
        
        {/* Checkmark */}
        <path className="check-path" d="M122,151 L133,164 L153,132" clipPath="url(#hx)"/>
        
        {/* Pothole */}
        <circle className="pothole-fill pothole-ring" cx="135" cy="185" r="11" clipPath="url(#hx)"/>
        <path className="pothole-crack" d="M130,182 L134,186 M138,180 L141,184 M131,188 L134,192" clipPath="url(#hx)"/>
        
        {/* Accent bar */}
        <line x1="44" y1="192" x2="226" y2="192" stroke="#18C99A" strokeWidth="1.5" opacity="0.3"/>
        
        {/* ── WORDMARK ── */}
        <text className="civica-text" x="276" y="148">CIVICA</text>
        
        {/* Accent divider */}
        <line className="divider-logo" x1="276" y1="163" x2="636" y2="163" strokeWidth="1.5"/>
        
        {/* Tagline */}
        <text className="tag-text" x="278" y="182">CIVIC ISSUE RESOLUTION</text>
        
        {/* Single powerful word */}
        <text className="sub-text" x="279" y="210">INFRASTRUCTURE</text>
      </svg>
    </div>
  );
}
