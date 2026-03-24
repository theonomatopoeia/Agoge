import { WORKOUT_PROGRAMS, ALT_ACTIVITIES } from '../data/workouts';

export function ProgramOverview({ onOpenWorkout, mobile }) {
  return (
    <div style={{ marginBottom: mobile ? '32px' : '48px' }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700, color: '#ddd',
        marginBottom: '20px',
        fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
      }}>THE THREE SESSIONS</h2>

      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        flexDirection: mobile ? 'column' : 'row',
      }}>
        {['A', 'B', 'C'].map(k => {
          const p = WORKOUT_PROGRAMS[k];
          return (
            <div
              key={k}
              onClick={() => onOpenWorkout(k)}
              style={{
                flex: mobile ? 'none' : '1 1 200px',
                backgroundColor: '#0c0c10', borderRadius: '14px',
                padding: mobile ? '16px' : '20px',
                border: '1px solid #1a1a1f', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                fontSize: '10px', letterSpacing: '2px', color: '#00d4aa',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                marginBottom: '8px',
              }}>WORKOUT {k}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ddd', marginBottom: '6px' }}>
                {p.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{p.focus}</div>
              <div style={{ fontSize: '11px', color: '#00d4aa66', marginTop: '12px' }}>
                Tap for full breakdown →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AltActivitiesView({ mobile }) {
  return (
    <div style={{ marginBottom: mobile ? '32px' : '48px' }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700, color: '#ddd',
        marginBottom: '20px',
        fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
      }}>BAD WAVE ALTERNATIVES</h2>

      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        flexDirection: mobile ? 'column' : 'row',
      }}>
        {Object.entries(ALT_ACTIVITIES).map(([k, a]) => (
          <div key={k} style={{
            flex: '1 1 200px', backgroundColor: '#0c0c10',
            borderRadius: '14px', padding: '20px',
            border: '1px solid #1a1a1f',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{a.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#82e0aa', marginBottom: '4px' }}>{a.name}</div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>{a.duration}</div>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>{a.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhilosophySection({ mobile }) {
  return (
    <div style={{
      marginBottom: mobile ? '32px' : '48px',
      backgroundColor: '#0c0c10', borderRadius: '16px',
      padding: mobile ? '20px' : '28px',
      border: '1px solid #1a1a1f',
    }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700, color: '#ddd',
        marginBottom: '16px',
        fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
      }}>TRAINING PHILOSOPHY</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
      }}>
        {[
          { title: 'Surf First, Gym Second', text: 'Cody Thompson trains no more than 3x/week and never chooses gym over a surf session.' },
          { title: 'Movement Patterns, Not Muscles', text: "Cris Mills: 'Squats, lunges, bends, rotations, pushes, pulls — those are the foundation.'" },
          { title: 'Hips & Knees Are Connected', text: "Jaco Rehab: 'If the hip cannot rotate, that twisting force goes to the knee.' Every session addresses both." },
          { title: 'Train Smart, Not Hard', text: "Dr. Tim Brown (Kelly Slater's coach): 'Simply training to make muscles stronger is a recipe for injury.'" },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#00d4aa', marginBottom: '6px' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
