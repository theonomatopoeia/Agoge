import { useState, useEffect } from 'react';
import { useMobile } from './hooks/useMobile';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { generateSchedule } from './data/schedule';
import { formatMonthYear } from './utils/dateUtils';

import { WorkoutDetail } from './components/WorkoutDetail';
import { WeekRow } from './components/WeekRow';
import { ProgressView } from './components/ProgressView';
import { ProgramOverview, AltActivitiesView, PhilosophySection } from './components/ContentSections';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [schedule, setSchedule] = useState([]);
  const [openWorkout, setOpenWorkout] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const mobile = useMobile(480);
  const { progress, toggle, isComplete, loaded: progressLoaded, reset } = useProgress();
  const { settings, loaded: settingsLoaded, updateSetting, getStartDate } = useSettings();

  // Regenerate schedule when start date changes
  useEffect(() => {
    if (!settingsLoaded || !settings?.startDate) return;
    const startDate = new Date(settings.startDate);
    setSchedule(generateSchedule(startDate));
  }, [settings?.startDate, settingsLoaded]);

  // Show loading until data is ready
  if (!settingsLoaded || !progressLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #08080c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          <div style={{
            fontSize: '10px',
            letterSpacing: '4px',
            color: '#00d4aa',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            marginBottom: '8px',
          }}>LOADING</div>
          <div style={{ fontSize: '14px', color: '#555' }}>Setting up your training…</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'schedule', label: 'Schedule' },
    { key: 'progress', label: 'Progress' },
    { key: 'workouts', label: 'Workouts' },
    { key: 'philosophy', label: 'Philosophy' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary, #08080c)',
      color: 'var(--text-primary, #e8e8ec)',
      fontFamily: "var(--font-body, 'Instrument Sans', -apple-system, sans-serif)",
    }}>
      {/* Workout detail modal */}
      {openWorkout && (
        <WorkoutDetail
          program={openWorkout}
          onClose={() => setOpenWorkout(null)}
          mobile={mobile}
        />
      )}

      {/* Header */}
      <div style={{
        padding: mobile ? '28px 16px 20px' : '48px 32px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
        borderBottom: '1px solid #111',
      }}>
        <div style={{
          fontSize: mobile ? '9px' : '10px',
          letterSpacing: mobile ? '3px' : '4px',
          color: '#00d4aa',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          marginBottom: '8px',
        }}>SURF PERFORMANCE PROGRAM</div>

        <h1 style={{
          fontSize: mobile ? '24px' : '36px',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '8px',
        }}>
          <span style={{ color: '#fff' }}>13-Week </span>
          <span style={{ color: '#48dbfb' }}>Surf</span>
          <span style={{ color: '#fff' }}> + </span>
          <span style={{ color: '#00d4aa' }}>Strength</span>
          <span style={{ color: '#fff' }}> Plan</span>
        </h1>

        <p style={{
          fontSize: mobile ? '12px' : '14px',
          color: '#666',
          maxWidth: '600px',
          lineHeight: 1.5,
        }}>
          3 gym sessions · 3 surf sessions · 1 softball night · alt activities for flat days.
          {mobile ? ' — ' : ' '}
          Built for an advanced surfer with tight hips and knees that need attention.
        </p>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginTop: mobile ? '16px' : '24px',
          flexWrap: 'wrap',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: mobile ? '6px 10px' : '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: mobile ? '11px' : '12px',
                letterSpacing: '1px',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                backgroundColor: activeTab === tab.key ? '#00d4aa15' : 'transparent',
                color: activeTab === tab.key ? '#00d4aa' : '#555',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: mobile ? '16px' : '32px',
      }}>
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {!mobile && (
              <div style={{
                display: 'flex', gap: '20px',
                marginBottom: '32px', flexWrap: 'wrap',
              }}>
                {[
                  { color: '#00d4aa', label: 'AM Gym' },
                  { color: '#48dbfb', label: 'Surf' },
                  { color: '#c39bd3', label: 'Softball' },
                  { color: '#82e0aa', label: 'Alt Activity' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '8px', height: '8px',
                      borderRadius: '2px',
                      backgroundColor: l.color,
                    }}/>
                    <span style={{
                      fontSize: '11px', color: '#666',
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    }}>{l.label}</span>
                  </div>
                ))}
              </div>
            )}

            {schedule.map((week, idx) => {
              const pm = idx > 0 ? schedule[idx - 1].startDate.getMonth() : -1;
              const cm = week.startDate.getMonth();
              const mn = formatMonthYear(week.startDate);
              return (
                <div key={week.weekNumber}>
                  {cm !== pm && (
                    <div style={{
                      fontSize: mobile ? '16px' : '20px',
                      fontWeight: 700,
                      color: '#333',
                      marginBottom: mobile ? '12px' : '20px',
                      marginTop: idx === 0 ? '0' : mobile ? '32px' : '48px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #151518',
                      fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
                      letterSpacing: '-0.5px',
                    }}>{mn}</div>
                  )}
                  <WeekRow
                    week={week}
                    onOpenWorkout={setOpenWorkout}
                    mobile={mobile}
                    progress={progress}
                    toggle={toggle}
                  />
                </div>
              );
            })}

            <div style={{
              marginTop: mobile ? '24px' : '40px',
              padding: mobile ? '16px' : '24px',
              backgroundColor: '#0c0c10', borderRadius: '14px',
              border: '1px solid #1a1a1f',
            }}>
              <div style={{
                fontSize: '10px', letterSpacing: '2px', color: '#f39c12',
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                marginBottom: '8px',
              }}>WEEKLY STRUCTURE</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>
                Gym days rotate each week. Workouts cycle A→B→C. Every 3rd week adds a 2nd alt day for recovery. Thursday = softball or surf. Every session includes hip mobility and knee-friendly mechanics.
              </div>
            </div>
          </>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <ProgressView
            schedule={schedule}
            progress={progress}
            isComplete={isComplete}
            toggle={toggle}
            mobile={mobile}
            reset={reset}
          />
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <>
            <ProgramOverview onOpenWorkout={setOpenWorkout} mobile={mobile}/>
            <AltActivitiesView mobile={mobile}/>
          </>
        )}

        {/* Philosophy Tab */}
        {activeTab === 'philosophy' && (
          <PhilosophySection mobile={mobile}/>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            updateSetting={updateSetting}
            getStartDate={getStartDate}
            mobile={mobile}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: mobile ? '16px' : '32px',
        maxWidth: '1100px',
        margin: '0 auto',
        borderTop: '1px solid #111',
        marginTop: mobile ? '24px' : '40px',
      }}>
        <div style={{
          fontSize: '10px', color: '#333', lineHeight: 1.8,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        }}>
          Sources: Cris Mills (CSCS) · Cody Thompson (CPT) · The Inertia · Jaco Rehab · Waterboyz · Again Faster · SurferToday · Renegade Surf Travel · Dr. Tim Brown (ESPN/Slater).
        </div>
      </div>
    </div>
  );
}
