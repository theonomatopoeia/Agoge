// ═══════════════════════════════════════════════════════════════
// SCHEDULE GENERATION
// ═══════════════════════════════════════════════════════════════
// Generates 13 weeks of training from a given start date.
// All dates normalized to midnight local time.

import { normalizeDate, dayName } from '../utils/dateUtils';

/**
 * Generate the full 13-week schedule.
 * @param {Date} startDate - The Monday (or any day) to start from
 * @returns {Array} Array of 13 week objects
 */
export function generateSchedule(startDate) {
  const start = normalizeDate(startDate);
  const weeks = [];
  const rotation = ['A', 'B', 'C'];
  let workoutIndex = 0;

  for (let w = 0; w < 13; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + w * 7);

    const days = [];
    let gymCount = 0;

    // Gym day patterns — which days-of-week get gym sessions
    const patterns = [
      [1, 3, 5], // Mon, Wed, Fri
      [1, 2, 4], // Mon, Tue, Thu
      [1, 3, 4], // Mon, Wed, Thu
      [2, 3, 5], // Tue, Wed, Fri
    ];
    const pattern = patterns[w % patterns.length];

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      const dow = date.getDay(); // 0=Sun ... 6=Sat
      const name = dayName(date);

      let am = null;
      let pm = null;

      if (dow === 0 || dow === 6) {
        // Weekend → surf
        pm = { type: 'surf', label: 'Surf' };
      } else {
        // Weekday
        if (pattern.includes(dow) && gymCount < 3) {
          am = { type: 'gym', program: rotation[workoutIndex % 3] };
          workoutIndex++;
          gymCount++;
        }

        if (dow === 4) {
          // Thursday → softball
          pm = { type: 'softball', label: 'Softball (or Surf)' };
        } else {
          // Assign alt activity or surf
          const nth = [1, 2, 3, 5];
          const di = nth.indexOf(dow);
          const isRecoveryWeek = w % 3 === 2; // Every 3rd week
          const altSlot1 = w % 4;
          const altSlot2 = (w + 2) % 4;

          if (di === altSlot1 || (isRecoveryWeek && di === altSlot2)) {
            const altOptions = ['run', 'mtb', 'yoga'];
            pm = {
              type: 'alt',
              activity: altOptions[di === altSlot1 ? w % 3 : (w + 1) % 3],
            };
          } else {
            pm = { type: 'surf', label: 'Surf' };
          }
        }
      }

      days.push({ date, dayOfWeek: dow, dayName: name, am, pm });
    }

    weeks.push({
      weekNumber: w + 1,
      startDate: weekStart,
      days,
    });
  }

  return weeks;
}
