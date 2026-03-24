import { dateKey, formatDateShort } from '../utils/dateUtils';
import { DayCard } from './DayCard';

export function WeekRow({ week, onOpenWorkout, mobile, progress, toggle }) {
  const ss = formatDateShort(week.startDate);
  const ed = new Date(week.startDate);
  ed.setDate(ed.getDate() + 6);
  const es = formatDateShort(ed);
  const wl = week.days.filter(d => d.am?.type === 'gym').map(d => d.am.program).join(' · ');

  // Completion counts
  let gymTotal = 0, gymDone = 0, surfTotal = 0, surfDone = 0;
  week.days.forEach(d => {
    const dk = dateKey(d.date);
    const dayP = (progress && progress[dk]) || {};
    if (d.am && d.am.type === 'gym') { gymTotal++; if (dayP.gym) gymDone++; }
    if (d.pm && d.pm.type === 'surf') { surfTotal++; if (dayP.surf) surfDone++; }
  });

  return (
    <div style={{ marginBottom: mobile ? '24px' : '32px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: mobile ? '8px' : '12px',
        padding: '0 4px', flexWrap: 'wrap', gap: '4px',
      }}>
        <div>
          <span style={{
            fontSize: mobile ? '10px' : '11px', letterSpacing: '3px',
            color: '#00d4aa',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontWeight: 600,
          }}>WEEK {week.weekNumber}</span>
          <span style={{
            fontSize: mobile ? '11px' : '13px', color: '#555',
            marginLeft: mobile ? '8px' : '12px',
          }}>{ss} — {es}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px',
            color: gymDone === gymTotal && gymTotal > 0 ? '#00d4aa' : '#00d4aa88',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}>
            {gymDone}/{gymTotal} gym{gymDone === gymTotal && gymTotal > 0 ? ' ✓' : ''}
          </span>
          <span style={{
            fontSize: '10px',
            color: surfDone === surfTotal && surfTotal > 0 ? '#48dbfb' : '#48dbfb88',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}>
            {surfDone}/{surfTotal} surf{surfDone === surfTotal && surfTotal > 0 ? ' ✓' : ''}
          </span>
        </div>
      </div>

      {mobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {week.days.map((d, i) => (
            <DayCard key={i} day={d} onOpenWorkout={onOpenWorkout} mobile={mobile} progress={progress} toggle={toggle}/>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {week.days.map((d, i) => (
            <DayCard key={i} day={d} onOpenWorkout={onOpenWorkout} mobile={mobile} progress={progress} toggle={toggle}/>
          ))}
        </div>
      )}
    </div>
  );
}
