import { useState } from 'react';
import { dateKey, isSameDay } from '../utils/dateUtils';
import { CheckBtn } from './CheckBtn';
import { ProgressChart } from './ProgressChart';
import { ALT_ACTIVITIES } from '../data/workouts';

export function ProgressView({ schedule, progress, isComplete, toggle, mobile, reset }) {
  // Compute totals
  let totalGym = 0, doneGym = 0, totalSurf = 0, doneSurf = 0, totalOther = 0, doneOther = 0;
  schedule.forEach(week => {
    week.days.forEach(d => {
      const key = dateKey(d.date);
      const dayP = progress[key] || {};
      if (d.am && d.am.type === 'gym') { totalGym++; if (dayP.gym) doneGym++; }
      if (d.pm) {
        if (d.pm.type === 'surf') { totalSurf++; if (dayP.surf) doneSurf++; }
        else if (d.pm.type === 'softball') { totalOther++; if (dayP.softball) doneOther++; }
        else { totalOther++; if (dayP.alt) doneOther++; }
      }
    });
  });
  const totalDone = doneGym + doneSurf + doneOther;
  const totalAll = totalGym + totalSurf + totalOther;
  const pct = totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;

  // Current week
  const now = new Date();
  const curWeek = schedule.find(w => {
    const end = new Date(w.startDate);
    end.setDate(end.getDate() + 6);
    return now >= w.startDate && now <= end;
  });

  const [showReset, setShowReset] = useState(false);

  return (
    <div>
      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
        gap: '12px', marginBottom: '28px',
      }}>
        {[
          { label: 'Overall', value: `${pct}%`, sub: `${totalDone}/${totalAll} activities`, color: '#00d4aa' },
          { label: 'Gym', value: `${doneGym}/${totalGym}`, sub: 'sessions', color: '#00d4aa' },
          { label: 'Surf', value: `${doneSurf}/${totalSurf}`, sub: 'sessions', color: '#48dbfb' },
          { label: 'Other', value: `${doneOther}/${totalOther}`, sub: 'softball + alt', color: '#c39bd3' },
        ].map(c => (
          <div key={c.label} style={{
            backgroundColor: '#0c0c10', borderRadius: '12px',
            padding: mobile ? '14px' : '18px',
            border: '1px solid #1a1a1f', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '9px', letterSpacing: '1.5px', color: '#555',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              marginBottom: '6px',
            }}>{c.label.toUpperCase()}</div>
            <div style={{
              fontSize: mobile ? '22px' : '28px', fontWeight: 700,
              color: c.color,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* This week card */}
      {curWeek && (
        <div style={{
          backgroundColor: '#0c0c10', borderRadius: '14px',
          padding: mobile ? '16px' : '20px',
          border: '1px solid #1a1a1f', marginBottom: '28px',
        }}>
          <div style={{
            fontSize: '10px', letterSpacing: '2px', color: '#00d4aa',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            marginBottom: '12px',
          }}>THIS WEEK (WEEK {curWeek.weekNumber})</div>

          <div style={{ display: 'flex', gap: mobile ? '8px' : '16px', flexWrap: 'wrap' }}>
            {curWeek.days.map((d, i) => {
              const key = dateKey(d.date);
              const dayP = progress[key] || {};
              const isToday = isSameDay(now, d.date);
              const isPast = d.date < now && !isToday;
              const hasGym = d.am && d.am.type === 'gym';
              const hasPM = d.pm !== null;
              const gymDone = dayP.gym;
              const pmType = d.pm?.type;
              const pmDone = pmType === 'surf' ? dayP.surf : pmType === 'softball' ? dayP.softball : dayP.alt;
              const allDone = (!hasGym || gymDone) && (!hasPM || pmDone);

              return (
                <div key={i} style={{
                  flex: mobile ? '1 1 calc(50% - 4px)' : '1 1 0',
                  minWidth: mobile ? 'calc(50% - 4px)' : '100px',
                  backgroundColor: isToday ? '#1a1a2e' : '#111116',
                  borderRadius: '10px', padding: '10px',
                  border: isToday ? '1px solid #00d4aa33' : '1px solid #181820',
                  position: 'relative',
                  opacity: isPast && !allDone ? 0.5 : 1,
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: 700,
                    color: isToday ? '#00d4aa' : '#555',
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    marginBottom: '6px',
                  }}>
                    {d.dayName.toUpperCase()}
                    {isToday && <span style={{ fontSize: '8px', color: '#00d4aa88', marginLeft: '4px' }}>TODAY</span>}
                  </div>

                  {hasGym && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckBtn checked={!!gymDone} onClick={() => toggle(d.date, 'gym')} size={18} color="#00d4aa"/>
                      <span style={{
                        fontSize: '11px',
                        color: gymDone ? '#00d4aa88' : '#888',
                        textDecoration: gymDone ? 'line-through' : 'none',
                      }}>Gym {d.am.program}</span>
                    </div>
                  )}

                  {hasPM && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckBtn
                        checked={!!pmDone}
                        onClick={() => toggle(d.date, pmType === 'surf' ? 'surf' : pmType === 'softball' ? 'softball' : 'alt')}
                        size={18}
                        color={pmType === 'surf' ? '#48dbfb' : pmType === 'softball' ? '#c39bd3' : '#82e0aa'}
                      />
                      <span style={{
                        fontSize: '11px',
                        color: pmDone ? '#66666688' : '#888',
                        textDecoration: pmDone ? 'line-through' : 'none',
                      }}>
                        {pmType === 'surf' ? 'Surf' : pmType === 'softball' ? 'Softball' : ALT_ACTIVITIES[d.pm.activity]?.name || 'Active'}
                      </span>
                    </div>
                  )}

                  {!hasGym && !hasPM && <div style={{ fontSize: '10px', color: '#333' }}>Rest</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{
        backgroundColor: '#0c0c10', borderRadius: '14px',
        padding: mobile ? '12px' : '20px',
        border: '1px solid #1a1a1f', marginBottom: '28px',
      }}>
        <ProgressChart schedule={schedule} progress={progress} mobile={mobile}/>
      </div>

      {/* Reset */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            style={{
              background: 'none', border: 'none', color: '#333',
              fontSize: '11px', cursor: 'pointer',
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
          >Reset all progress</button>
        ) : (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888' }}>Are you sure?</span>
            <button
              onClick={() => { reset(); setShowReset(false); }}
              style={{
                background: '#ff4757', border: 'none', color: '#fff',
                fontSize: '11px', padding: '6px 16px', borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              }}
            >Yes, reset</button>
            <button
              onClick={() => setShowReset(false)}
              style={{
                background: '#222', border: 'none', color: '#888',
                fontSize: '11px', padding: '6px 16px', borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              }}
            >Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
