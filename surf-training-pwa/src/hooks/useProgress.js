import { useState, useEffect, useCallback } from 'react';
import db from '../db';
import { dateKey } from '../utils/dateUtils';

/**
 * Progress tracking hook backed by IndexedDB (Dexie).
 * 
 * Data shape: { [dateKey]: { gym?: true, surf?: true, alt?: true, softball?: true } }
 * 
 * Each dateKey row in IndexedDB:
 *   { dateKey: "2026-03-23", gym: true, surf: true }
 */
export function useProgress() {
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load all progress from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await db.progress.toArray();
        if (cancelled) return;
        const data = {};
        for (const row of rows) {
          const { dateKey: key, ...activities } = row;
          if (Object.keys(activities).length > 0) {
            data[key] = activities;
          }
        }
        setProgress(data);
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Toggle an activity for a given date
  const toggle = useCallback((date, activity) => {
    const key = dateKey(date);

    setProgress(prev => {
      const dayData = { ...(prev[key] || {}) };

      if (dayData[activity]) {
        delete dayData[activity];
      } else {
        dayData[activity] = true;
      }

      const next = { ...prev };
      if (Object.keys(dayData).length === 0) {
        delete next[key];
        // Remove from IndexedDB
        db.progress.delete(key).catch(e =>
          console.error('Failed to delete progress:', e)
        );
      } else {
        next[key] = dayData;
        // Upsert into IndexedDB
        db.progress.put({ dateKey: key, ...dayData }).catch(e =>
          console.error('Failed to save progress:', e)
        );
      }

      return next;
    });
  }, []);

  // Check if a specific activity is complete
  const isComplete = useCallback((date, activity) => {
    const key = dateKey(date);
    return !!(progress[key] && progress[key][activity]);
  }, [progress]);

  // Reset all progress
  const reset = useCallback(async () => {
    setProgress({});
    try {
      await db.progress.clear();
    } catch (e) {
      console.error('Failed to clear progress:', e);
    }
  }, []);

  return { progress, toggle, isComplete, loaded, reset };
}
