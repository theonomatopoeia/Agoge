import { EX_DATA } from '../data/exercises';
import { ExercisePlaceholder } from './ExercisePlaceholder';

export function ExerciseDetailView({ exerciseName, sets, sectionColor, onBack, mobile }) {
  const data = EX_DATA[exerciseName];

  if (!data) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#00d4aa', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
          ← Back
        </button>
        <p style={{ color: '#888' }}>Detail coming soon for "{exerciseName}".</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideIn 0.25s ease-out' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: '#00d4aa',
          cursor: 'pointer', fontSize: '13px', marginBottom: '20px',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}
      >
        ← Back to workout
      </button>

      <div style={{
        fontSize: '10px', letterSpacing: '2px', color: sectionColor,
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        marginBottom: '6px',
      }}>
        {sets}
      </div>

      <h3 style={{
        fontSize: mobile ? '18px' : '22px', fontWeight: 700,
        color: '#fff', marginBottom: '16px',
        fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
      }}>
        {exerciseName}
      </h3>

      {/* Placeholder visual (replaces canvas animation) */}
      <div style={{ marginBottom: '20px' }}>
        <ExercisePlaceholder
          exerciseName={exerciseName}
          category={data.category}
          muscleGroups={data.muscleGroups}
          sectionColor={sectionColor}
        />
      </div>

      {/* Muscles & Equipment */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
        gap: '12px', marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#0c0c10', borderRadius: '10px',
          padding: '14px', border: '1px solid #1a1a1f',
        }}>
          <div style={{
            fontSize: '9px', letterSpacing: '1.5px', color: '#555',
            marginBottom: '4px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}>MUSCLES</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>{data.muscles}</div>
        </div>
        <div style={{
          backgroundColor: '#0c0c10', borderRadius: '10px',
          padding: '14px', border: '1px solid #1a1a1f',
        }}>
          <div style={{
            fontSize: '9px', letterSpacing: '1.5px', color: '#555',
            marginBottom: '4px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}>EQUIPMENT</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>{data.equip}</div>
        </div>
      </div>

      {/* Surf relevance */}
      <div style={{
        backgroundColor: '#00d4aa08', borderRadius: '10px',
        padding: mobile ? '12px' : '16px',
        border: '1px solid #00d4aa15', marginBottom: '24px',
      }}>
        <div style={{
          fontSize: '9px', letterSpacing: '1.5px', color: '#00d4aa',
          marginBottom: '6px',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}>WHY THIS FOR SURFING</div>
        <div style={{ fontSize: '13px', color: '#999', lineHeight: 1.6 }}>
          {data.surfWhy}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div style={{
          fontSize: '10px', letterSpacing: '2px', color: sectionColor,
          marginBottom: '14px',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}>HOW TO PERFORM</div>
        {data.steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: '12px',
            marginBottom: '14px', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px',
              backgroundColor: `${sectionColor}15`, color: sectionColor,
              fontSize: '11px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}>{i + 1}</div>
            <div style={{ fontSize: '13px', color: '#bbb', lineHeight: 1.6 }}>
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
