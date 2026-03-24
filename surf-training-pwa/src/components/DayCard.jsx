import { WORKOUT_PROGRAMS, ALT_ACTIVITIES } from '../data/workouts';
import { dateKey, formatDateShort, isSameDay } from '../utils/dateUtils';
import { CheckBtn } from './CheckBtn';

export function DayCard({ day, onOpenWorkout, mobile, progress, toggle }) {
  const hasAM = day.am !== null;
  const hasPM = day.pm !== null;
  const today = new Date();
  const isToday = isSameDay(today, day.date);
  const isWE = day.dayOfWeek === 0 || day.dayOfWeek === 6;
  const ds = formatDateShort(day.date);
  const dk = dateKey(day.date);
  const dayP = (progress && progress[dk]) || {};
  const gymDone = dayP.gym;
  const pmType = day.pm?.type;
  const pmDone = pmType === 'surf' ? dayP.surf : pmType === 'softball' ? dayP.softball : dayP.alt;
  const pmKey = pmType === 'surf' ? 'surf' : pmType === 'softball' ? 'softball' : 'alt';

  if (mobile) {
    const pmLabel = hasPM
      ? (day.pm.type === 'surf' ? '🏄 Surf'
        : day.pm.type === 'softball' ? '🥎 Softball'
        : `${ALT_ACTIVITIES[day.pm.activity]?.icon || ''} ${ALT_ACTIVITIES[day.pm.activity]?.name || 'Recovery'}`)
      : '';
    const amLabel = hasAM && day.am.type === 'gym' ? `Workout ${day.am.program}` : null;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 12px',
        backgroundColor: isToday ? '#1a1a2e' : '#0c0c10',
        borderRadius: '10px',
        border: isToday ? '1px solid #00d4aa44' : '1px solid #1a1a1f',
        position: 'relative', minHeight: '48px',
      }}>
        {isToday && <div style={{
          position: 'absolute', left: '-1px', top: '50%',
          transform: 'translateY(-50%)',
          width: '3px', height: '24px', borderRadius: '0 3px 3px 0',
          backgroundColor: '#00d4aa',
        }}/>}

        <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            color: isWE ? '#48dbfb' : '#666',
            letterSpacing: '1px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}>{day.dayName.toUpperCase()}</div>
          <div style={{ fontSize: '9px', color: '#444' }}>{ds}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {amLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {toggle && <CheckBtn checked={!!gymDone} onClick={() => toggle(day.date, 'gym')} size={18} color="#00d4aa"/>}
              <div
                onClick={() => onOpenWorkout(day.am.program)}
                style={{
                  backgroundColor: '#00d4aa12', borderRadius: '6px',
                  padding: '4px 10px', border: '1px solid #00d4aa22',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: gymDone ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '9px', color: '#00d4aa', fontFamily: "var(--font-mono)", fontWeight: 600 }}>GYM</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#ccc', textDecoration: gymDone ? 'line-through' : 'none' }}>
                  {WORKOUT_PROGRAMS[day.am.program].name.split('+')[0].trim()}
                </span>
                <span style={{ fontSize: '10px', color: '#00d4aa88' }}>→</span>
              </div>
            </div>
          )}
          {hasPM && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {toggle && <CheckBtn checked={!!pmDone} onClick={() => toggle(day.date, pmKey)} size={18} color={pmType === 'surf' ? '#48dbfb' : pmType === 'softball' ? '#c39bd3' : '#82e0aa'}/>}
              <span style={{
                fontSize: '11px',
                color: pmDone ? '#33333388' : day.pm.type === 'surf' ? '#48dbfb88' : day.pm.type === 'softball' ? '#c39bd388' : '#82e0aa88',
                textDecoration: pmDone ? 'line-through' : 'none',
              }}>{pmLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop card
  return (
    <div style={{
      minWidth: '120px', flex: 1,
      backgroundColor: isToday ? '#1a1a2e' : '#0c0c10',
      borderRadius: '12px', padding: '14px 12px',
      border: isToday ? '1px solid #00d4aa44' : '1px solid #1a1a1f',
      display: 'flex', flexDirection: 'column', gap: '6px',
      position: 'relative',
    }}>
      {isToday && <div style={{
        position: 'absolute', top: '-1px', left: '50%',
        transform: 'translateX(-50%)',
        width: '30px', height: '3px', borderRadius: '0 0 3px 3px',
        backgroundColor: '#00d4aa',
      }}/>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: isWE ? '#48dbfb' : '#777',
          letterSpacing: '1px',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}>{day.dayName.toUpperCase()}</span>
        <span style={{ fontSize: '10px', color: '#444' }}>{ds}</span>
      </div>

      {hasAM && day.am.type === 'gym' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {toggle && <CheckBtn checked={!!gymDone} onClick={() => toggle(day.date, 'gym')} size={18} color="#00d4aa"/>}
          <div
            onClick={() => onOpenWorkout(day.am.program)}
            style={{
              flex: 1, backgroundColor: '#00d4aa12', borderRadius: '8px',
              padding: '8px', cursor: 'pointer',
              border: '1px solid #00d4aa22', transition: 'all 0.15s',
              opacity: gymDone ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: '9px', color: '#00d4aa', letterSpacing: '1.5px', fontFamily: "var(--font-mono)", marginBottom: '2px' }}>AM GYM</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#ccc', textDecoration: gymDone ? 'line-through' : 'none' }}>
              {WORKOUT_PROGRAMS[day.am.program].name.split('+')[0].trim()}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '1px' }}>Workout {day.am.program}</div>
          </div>
        </div>
      )}

      {hasPM && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {toggle && <CheckBtn checked={!!pmDone} onClick={() => toggle(day.date, pmKey)} size={18} color={pmType === 'surf' ? '#48dbfb' : pmType === 'softball' ? '#c39bd3' : '#82e0aa'}/>}
          <div style={{
            flex: 1,
            backgroundColor: day.pm.type === 'surf' ? '#48dbfb0a' : day.pm.type === 'softball' ? '#c39bd30a' : '#82e0aa0a',
            borderRadius: '8px', padding: '8px',
            border: `1px solid ${day.pm.type === 'surf' ? '#48dbfb15' : day.pm.type === 'softball' ? '#c39bd315' : '#82e0aa15'}`,
            opacity: pmDone ? 0.5 : 1,
          }}>
            <div style={{
              fontSize: '9px', letterSpacing: '1.5px',
              fontFamily: "var(--font-mono)", marginBottom: '2px',
              color: day.pm.type === 'surf' ? '#48dbfb' : day.pm.type === 'softball' ? '#c39bd3' : '#82e0aa',
            }}>{isWE ? '' : 'PM '}{day.pm.type === 'surf' ? 'SURF' : day.pm.type === 'softball' ? 'SOFTBALL' : 'ACTIVE'}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#aaa', textDecoration: pmDone ? 'line-through' : 'none' }}>
              {day.pm.type === 'surf' ? '🏄 Surf'
                : day.pm.type === 'softball' ? '🥎 Softball / Surf'
                : `${ALT_ACTIVITIES[day.pm.activity]?.icon || '🏃'} ${ALT_ACTIVITIES[day.pm.activity]?.name || 'Active Recovery'}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
