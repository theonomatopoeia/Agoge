# Surf + Strength Training PWA

## Deploy to Vercel (5 minutes, free)

### Step 1: Get the code on GitHub

1. Go to [github.com](https://github.com) (create account if needed)
2. Click the green **"New"** button (or go to github.com/new)
3. Name it `surf-training` (or whatever you want)
4. Keep it **Public** (required for free Vercel)
5. Click **"Create repository"**
6. On the next page, click **"uploading an existing file"**
7. Drag the entire `surf-training-pwa` folder contents into the upload area
   - Make sure `package.json` is at the root level (not inside a subfolder)
8. Click **"Commit changes"**

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **"Add New Project"**
3. Find your `surf-training` repo and click **"Import"**
4. Vercel auto-detects Vite — just click **"Deploy"**
5. Wait ~60 seconds. Done. You'll get a URL like `surf-training-abc123.vercel.app`

### Step 3: Install on iPhone

1. Open the Vercel URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (📤 at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon appears on your home screen. Tap it — runs fullscreen, no browser chrome.

### Updating the app

When we build Phase 2, 3, etc:
1. I give you the updated files
2. You push them to GitHub (replace the old files)
3. Vercel auto-deploys. Takes ~30 seconds.
4. Refresh the app on your phone (or just close and reopen it).

---

## Project Structure

```
surf-training-pwa/
├── index.html              ← Entry point with iOS PWA meta tags
├── package.json            ← Dependencies (React, Dexie, Vite)
├── vite.config.js          ← Vite + PWA plugin config
├── public/
│   ├── icon-192.png        ← PWA icon
│   ├── icon-512.png        ← PWA icon (large)
│   └── apple-touch-icon.png← iOS home screen icon
└── src/
    ├── main.jsx            ← React entry
    ├── App.jsx             ← Main app (tabs, layout)
    ├── index.css           ← Global styles + iOS safe areas
    ├── db.js               ← Dexie.js database (IndexedDB)
    ├── data/
    │   ├── workouts.js     ← Workout programs A/B/C + alt activities
    │   ├── exercises.js    ← Exercise detail data (muscles, steps, etc.)
    │   └── schedule.js     ← 13-week schedule generator
    ├── hooks/
    │   ├── useMobile.js    ← Responsive breakpoint hook
    │   ├── useProgress.js  ← Progress tracking (IndexedDB-backed)
    │   └── useSettings.js  ← App settings (start date, etc.)
    ├── utils/
    │   └── dateUtils.js    ← Timezone-safe date helpers
    └── components/
        ├── CheckBtn.jsx         ← Circular checkbox
        ├── DayCard.jsx          ← Single day in schedule
        ├── WeekRow.jsx          ← Week row in schedule
        ├── WorkoutDetail.jsx    ← Full workout modal
        ├── ExerciseDetailView.jsx ← Exercise drill-down
        ├── ExercisePlaceholder.jsx ← SVG placeholder (replaces canvas anims)
        ├── ProgressChart.jsx    ← Canvas bar chart
        ├── ProgressView.jsx     ← Progress tab content
        ├── ContentSections.jsx  ← Program overview, alt activities, philosophy
        └── SettingsView.jsx     ← Settings with date picker + export/import
```

## Data Storage

All data is stored in **IndexedDB** on your device via Dexie.js:

- `progress` table — daily activity completions
- `settings` table — app configuration (start date, etc.)

**Important:** Clearing Safari data will erase this. Use the Export button in Settings regularly.

## What's different from the Claude artifact

1. **Persistence** — Data lives in IndexedDB, survives app restarts
2. **Offline** — Service worker caches everything, works without internet
3. **Installable** — Runs as a home screen app, no browser chrome
4. **Settings** — Change start date anytime
5. **Backup** — JSON export/import built in
6. **No canvas animations** — Replaced with category-based SVG placeholders (Phase 5 will add real visuals)
7. **Clean architecture** — Modular files instead of one 2000-line blob
