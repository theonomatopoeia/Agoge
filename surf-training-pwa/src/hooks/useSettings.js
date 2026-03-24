import { useState, useEffect, useCallback } from 'react';
import db from '../db';

const SETTINGS_KEY = 'app';

/**
 * Default settings for a new install.
 * Start date defaults to the most recent Monday.
 */
function getDefaultSettings() {
  const now = new Date();
  // Find most recent Monday
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  return {
    startDate: monday.toISOString(),
  };
}

/**
 * Settings hook backed by IndexedDB (Dexie).
 * Stores a single row with key="app" containing all settings.
 */
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await db.settings.get(SETTINGS_KEY);
        if (cancelled) return;
        if (row) {
          // Merge with defaults in case new settings were added
          const { key, ...stored } = row;
          setSettings({ ...getDefaultSettings(), ...stored });
        } else {
          const defaults = getDefaultSettings();
          setSettings(defaults);
          // Persist defaults
          await db.settings.put({ key: SETTINGS_KEY, ...defaults });
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        if (!cancelled) setSettings(getDefaultSettings());
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Update a setting
  const updateSetting = useCallback(async (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      // Persist asynchronously
      db.settings.put({ key: SETTINGS_KEY, ...next }).catch(e =>
        console.error('Failed to save settings:', e)
      );
      return next;
    });
  }, []);

  // Get start date as a Date object
  const getStartDate = useCallback(() => {
    if (!settings?.startDate) return new Date();
    return new Date(settings.startDate);
  }, [settings]);

  return { settings, loaded, updateSetting, getStartDate };
}
