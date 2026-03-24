/**
 * Exercise placeholder visual.
 * Replaces canvas animations with a clean SVG icon showing the
 * movement category + highlighted muscle groups.
 * Phase 5 will replace this with real media.
 */

const CATEGORY_ICONS = {
  pull: {
    label: 'PULL',
    color: '#00d4aa',
    // Person pulling — simplified rowing motion
    svg: (
      <g>
        <circle cx="50" cy="28" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="38" x2="50" y2="70" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="38" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="62" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="30" y2="52" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="52" x2="22" y2="42" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="70" y2="52" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="70" y1="52" x2="78" y2="42" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M42 42 Q50 36 58 42" stroke="#00d4aa" strokeWidth="2" fill="none" opacity="0.6"/>
      </g>
    ),
  },
  push: {
    label: 'PUSH',
    color: '#48dbfb',
    svg: (
      <g>
        <circle cx="50" cy="28" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="38" x2="50" y2="70" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="38" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="62" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="30" y2="38" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="38" x2="20" y2="30" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="70" y2="38" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="70" y1="38" x2="80" y2="30" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M38 44 Q50 50 62 44" stroke="#48dbfb" strokeWidth="2" fill="none" opacity="0.6"/>
      </g>
    ),
  },
  squat: {
    label: 'SQUAT',
    color: '#f39c12',
    svg: (
      <g>
        <circle cx="50" cy="28" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="38" x2="50" y2="62" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="62" x2="35" y2="72" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="35" y1="72" x2="32" y2="92" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="62" x2="65" y2="72" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="65" y1="72" x2="68" y2="92" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="36" y2="45" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="64" y2="45" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="50" cy="64" rx="12" ry="6" fill="none" stroke="#f39c12" strokeWidth="1.5" opacity="0.5"/>
      </g>
    ),
  },
  hinge: {
    label: 'HINGE',
    color: '#e74c3c',
    svg: (
      <g>
        <circle cx="38" cy="32" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="42" y1="40" x2="55" y2="62" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="55" y1="62" x2="50" y2="85" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="55" y1="62" x2="65" y2="85" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="46" y1="48" x2="30" y2="55" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="55" x2="22" y2="65" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="55" cy="60" rx="8" ry="5" fill="none" stroke="#e74c3c" strokeWidth="1.5" opacity="0.5"/>
      </g>
    ),
  },
  rotate: {
    label: 'ROTATE',
    color: '#9b59b6',
    svg: (
      <g>
        <circle cx="50" cy="28" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="38" x2="50" y2="70" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="40" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="70" x2="60" y2="90" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="30" y2="38" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="48" x2="70" y2="58" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M38 50 A15 15 0 0 1 62 50" stroke="#9b59b6" strokeWidth="1.5" fill="none" opacity="0.6" strokeDasharray="3 2"/>
        <polygon points="62,47 65,52 59,52" fill="#9b59b6" opacity="0.6"/>
      </g>
    ),
  },
  stretch: {
    label: 'STRETCH',
    color: '#2ecc71',
    svg: (
      <g>
        <circle cx="50" cy="32" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="42" x2="50" y2="68" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="68" x2="35" y2="88" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="68" x2="65" y2="88" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="50" x2="28" y2="35" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="50" x2="72" y2="35" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M30 80 Q50 75 70 80" stroke="#2ecc71" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="4 2"/>
      </g>
    ),
  },
  balance: {
    label: 'BALANCE',
    color: '#e67e22',
    svg: (
      <g>
        <circle cx="50" cy="24" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="34" x2="50" y2="62" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="62" x2="50" y2="88" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="62" x2="70" y2="72" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="46" x2="32" y2="36" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="46" x2="68" y2="36" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="40" y1="90" x2="60" y2="90" stroke="#e67e22" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
      </g>
    ),
  },
  plyo: {
    label: 'EXPLOSIVE',
    color: '#ff6b6b',
    svg: (
      <g>
        <circle cx="50" cy="22" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="32" x2="50" y2="56" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="56" x2="38" y2="72" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="38" y1="72" x2="35" y2="86" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="56" x2="62" y2="72" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="62" y1="72" x2="65" y2="86" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="42" x2="32" y2="30" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="42" x2="68" y2="30" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M42 88 L46 80 L50 88 L54 80 L58 88" stroke="#ff6b6b" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </g>
    ),
  },
  carry: {
    label: 'CARRY',
    color: '#1abc9c',
    svg: (
      <g>
        <circle cx="50" cy="24" r="10" fill="#c8a882" stroke="#7a6248" strokeWidth="1.2"/>
        <line x1="50" y1="34" x2="50" y2="66" stroke="#c8a882" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="66" x2="40" y2="88" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="66" x2="60" y2="88" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="44" x2="34" y2="44" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="34" y1="44" x2="34" y2="60" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="50" y1="44" x2="66" y2="44" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="66" y1="44" x2="66" y2="60" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="30" y="58" width="8" height="10" rx="2" fill="#1abc9c" opacity="0.4"/>
        <rect x="62" y="58" width="8" height="10" rx="2" fill="#1abc9c" opacity="0.4"/>
      </g>
    ),
  },
};

export function ExercisePlaceholder({ exerciseName, category, muscleGroups = [], sectionColor }) {
  const cat = CATEGORY_ICONS[category] || CATEGORY_ICONS.stretch;

  return (
    <div style={{
      backgroundColor: '#0a0a10',
      borderRadius: '16px',
      border: '1px solid #1a1a22',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
    }}>
      {/* SVG figure */}
      <svg
        viewBox="0 0 100 100"
        width="120"
        height="120"
        style={{ opacity: 0.8 }}
      >
        {cat.svg}
      </svg>

      {/* Category badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '9px',
          letterSpacing: '2px',
          color: cat.color,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          padding: '3px 10px',
          borderRadius: '4px',
          backgroundColor: `${cat.color}15`,
          border: `1px solid ${cat.color}30`,
        }}>
          {cat.label}
        </span>
      </div>

      {/* Muscle tags */}
      {muscleGroups.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {muscleGroups.map(m => (
            <span key={m} style={{
              fontSize: '10px',
              color: '#888',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#151520',
              border: '1px solid #1e1e28',
            }}>
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Phase 5 note */}
      <div style={{
        fontSize: '10px',
        color: '#444',
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        textAlign: 'center',
      }}>
        animated guide coming soon
      </div>
    </div>
  );
}
