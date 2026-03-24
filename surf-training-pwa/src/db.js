import Dexie from 'dexie';

// ═══════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════
// 
// Tables:
//   progress   — daily completion tracking (gym, surf, etc.)
//   settings   — app config (start date, surf spots, boards)
//   
// Future tables (Phase 4):
//   activities — rich activity logging with details
//
// All data lives in IndexedDB on the user's device.
// Clearing Safari data will erase it — export/import is in Settings.
// ═══════════════════════════════════════════════════════════════

const db = new Dexie('SurfTrainingDB');

db.version(1).stores({
  // dateKey ("2026-03-23") → { gym: true, surf: true, alt: true, softball: true }
  progress: 'dateKey',
  // Single row keyed by "app" — stores all settings as one object
  settings: 'key',
});

export default db;

// ─── Helper: Export all data as JSON ─────────────────────────
export async function exportAllData() {
  const progress = await db.progress.toArray();
  const settings = await db.settings.toArray();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress,
    settings,
  };
}

// ─── Helper: Import data from JSON ──────────────────────────
export async function importAllData(data) {
  if (!data || data.version !== 1) {
    throw new Error('Invalid backup file format');
  }
  
  await db.transaction('rw', db.progress, db.settings, async () => {
    // Clear existing data
    await db.progress.clear();
    await db.settings.clear();
    
    // Import progress
    if (data.progress && Array.isArray(data.progress)) {
      await db.progress.bulkPut(data.progress);
    }
    
    // Import settings
    if (data.settings && Array.isArray(data.settings)) {
      await db.settings.bulkPut(data.settings);
    }
  });
}

// ─── Helper: Clear all progress (reset) ─────────────────────
export async function clearAllProgress() {
  await db.progress.clear();
}
