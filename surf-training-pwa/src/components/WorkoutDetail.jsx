import { useState } from 'react';
import { WORKOUT_PROGRAMS } from '../data/workouts';
import { EX_DATA } from '../data/exercises';
import { ExerciseDetailView } from './ExerciseDetailView';

export function WorkoutDetail({ program, onClose, mobile }) {
  const [sel, setSel] = useState(null);
  const data = WORKOUT_PROGRAMS[program];
  if (!data) return null;

  const sections = [
    { label: 'WARMUP', items: data.warmup, color: '#f39c12' },
    { label: 'MAIN WORK', items: data.main, color: '#00d4aa' },
    { label: 'FINISHER + MOBILITY', items: data.finisher, color: '#48dbfb' },
  ];

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
        display: 'flex',
        alignItems: mobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: mobile ? 0 : '20px',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#111116',
          borderRadius: mobile ? 0 : '20px',
          maxWidth: mobile ? '100%' : '680px',
          width: '100%',
          maxHeight: mobile ? '100vh' : '85vh',
          height: mobile ? '100vh' : 'auto',
          overflowY: 'auto',
          padding: mobile ? '20px 16px' : '36px',
          color: '#e8e8ec',
          border: mobile ? 'none' : '1px solid rgba(0,212,170,0.2)',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: mobile ? 'sticky' : 'absolute',
            top: mobile ? '0' : '16px',
            right: mobile ? 'auto' : '20px',
            background: mobile ? '#111116' : 'none',
            border: 'none', color: '#888', fontSize: '24px',
            cursor: 'pointer', zIndex: 10,
            display: 'block',
            padding: mobile ? '8px 0 12px' : '0',
            width: mobile ? '100%' : 'auto',
            textAlign: mobile ? 'right' : 'center',
          }}
        >×</button>

        {sel ? (
          <ExerciseDetailView
            exerciseName={sel.exercise}
            sets={sel.sets}
            sectionColor={sel.color}
            onBack={() => setSel(null)}
            mobile={mobile}
          />
        ) : (
          <>
            <div style={{
              fontSize: '11px', letterSpacing: '3px', color: '#00d4aa',
              marginBottom: '6px',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}>WORKOUT {program}</div>

            <h2 style={{
              fontSize: mobile ? '20px' : '24px', fontWeight: 700,
              marginBottom: '8px',
              fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
              color: '#fff',
            }}>{data.name}</h2>

            <p style={{ fontSize: '13px', color: '#999', marginBottom: '6px', lineHeight: 1.5 }}>
              {data.focus}
            </p>
            <p style={{ fontSize: '13px', color: '#777', marginBottom: '20px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.why}
            </p>
            <p style={{ fontSize: '11px', color: '#555', marginBottom: '24px' }}>
              Sources: {data.sources}
            </p>

            {sections.map(s => (
              <div key={s.label} style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '10px', letterSpacing: '2.5px', color: s.color,
                  marginBottom: '12px',
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  borderBottom: `1px solid ${s.color}33`, paddingBottom: '6px',
                }}>{s.label}</div>

                {s.items.map((item, i) => {
                  const has = !!EX_DATA[item.exercise];
                  return (
                    <div
                      key={i}
                      onClick={() => has && setSel({ ...item, color: s.color })}
                      style={{
                        marginBottom: mobile ? '10px' : '14px',
                        borderLeft: `2px solid ${s.color}44`,
                        borderRadius: '0 8px 8px 0',
                        padding: mobile ? '8px 10px' : '10px 12px',
                        cursor: has ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                        backgroundColor: 'transparent',
                        minHeight: mobile ? '44px' : 'auto',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'baseline', marginBottom: '3px',
                        flexWrap: mobile ? 'wrap' : 'nowrap',
                        gap: mobile ? '4px' : '0',
                      }}>
                        <span style={{ fontSize: mobile ? '13px' : '14px', fontWeight: 600, color: '#ddd' }}>
                          {item.exercise}
                          {has && <span style={{ fontSize: '10px', color: `${s.color}88`, marginLeft: '8px' }}>→</span>}
                        </span>
                        <span style={{
                          fontSize: '12px', color: s.color,
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                          flexShrink: 0, marginLeft: mobile ? '0' : '12px',
                        }}>{item.sets}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, margin: 0 }}>
                        {item.notes}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}

            <div style={{
              fontSize: '11px', color: '#555', marginTop: '16px',
              paddingTop: '16px', borderTop: '1px solid #222',
            }}>
              Target: 45-55 min. Tap any exercise for details.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
