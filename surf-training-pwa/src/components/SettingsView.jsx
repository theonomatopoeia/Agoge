import { useState, useRef } from 'react';
import { toInputDateString, fromInputDateString } from '../utils/dateUtils';
import { exportAllData, importAllData } from '../db';

export function SettingsView({ settings, updateSetting, getStartDate, mobile }) {
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const fileInputRef = useRef(null);

  const startDate = getStartDate();

  // ── Start date change ────────────────────────────────────
  const handleDateChange = (e) => {
    const newDate = fromInputDateString(e.target.value);
    setPendingDate(newDate);
    setShowDateConfirm(true);
  };

  const confirmDateChange = () => {
    if (pendingDate) {
      updateSetting('startDate', pendingDate.toISOString());
    }
    setShowDateConfirm(false);
    setPendingDate(null);
  };

  // ── Export ────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `surf-training-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error('Export failed:', e);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // ── Import ────────────────────────────────────────────────
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      setImportStatus('success');
      // Reload page to pick up imported data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Import failed:', err);
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }

    // Reset file input
    e.target.value = '';
  };

  const sectionStyle = {
    backgroundColor: '#0c0c10',
    borderRadius: '14px',
    padding: mobile ? '16px' : '20px',
    border: '1px solid #1a1a1f',
    marginBottom: '16px',
  };

  const labelStyle = {
    fontSize: '9px',
    letterSpacing: '2px',
    color: '#555',
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    marginBottom: '10px',
  };

  const btnStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #1a1a1f',
    backgroundColor: '#111116',
    color: '#ccc',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "var(--font-body, 'Instrument Sans', sans-serif)",
    transition: 'all 0.15s',
    minHeight: '44px',
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Start Date */}
      <div style={sectionStyle}>
        <div style={labelStyle}>PROGRAM START DATE</div>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.5 }}>
          The 13-week schedule starts from this date. Changing it will recalculate the entire schedule.
        </p>
        <input
          type="date"
          value={toInputDateString(startDate)}
          onChange={handleDateChange}
          style={{
            backgroundColor: '#111116',
            border: '1px solid #1a1a1f',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#ccc',
            fontSize: '14px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            width: '100%',
            maxWidth: '220px',
            minHeight: '44px',
            WebkitAppearance: 'none',
            colorScheme: 'dark',
          }}
        />
        {showDateConfirm && (
          <div style={{
            marginTop: '12px', padding: '12px',
            backgroundColor: '#f39c1210', borderRadius: '8px',
            border: '1px solid #f39c1230',
          }}>
            <p style={{ fontSize: '12px', color: '#f39c12', marginBottom: '10px' }}>
              Change start date to {pendingDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}? Your progress data will still be saved.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={confirmDateChange} style={{ ...btnStyle, backgroundColor: '#f39c1220', color: '#f39c12', border: '1px solid #f39c1240' }}>
                Confirm
              </button>
              <button onClick={() => { setShowDateConfirm(false); setPendingDate(null); }} style={btnStyle}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div style={sectionStyle}>
        <div style={labelStyle}>DATA BACKUP</div>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', lineHeight: 1.5 }}>
          Your data lives on this device only. Export regularly to avoid losing progress if you clear Safari data.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={{ ...btnStyle, backgroundColor: '#00d4aa12', color: '#00d4aa', border: '1px solid #00d4aa30' }}>
            📤 Export Data
          </button>
          <button onClick={handleImport} style={{ ...btnStyle, backgroundColor: '#48dbfb12', color: '#48dbfb', border: '1px solid #48dbfb30' }}>
            📥 Import Data
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        {exportStatus === 'success' && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#00d4aa' }}>
            ✓ Backup downloaded successfully
          </div>
        )}
        {exportStatus === 'error' && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#ff4757' }}>
            ✗ Export failed. Check browser console for details.
          </div>
        )}
        {importStatus === 'success' && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#00d4aa' }}>
            ✓ Import successful! Reloading...
          </div>
        )}
        {importStatus === 'error' && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#ff4757' }}>
            ✗ Import failed. Make sure you selected a valid backup file.
          </div>
        )}
      </div>

      {/* About */}
      <div style={sectionStyle}>
        <div style={labelStyle}>ABOUT</div>
        <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#ccc' }}>Surf + Strength Training v1.0</strong>
          </p>
          <p style={{ marginBottom: '4px' }}>
            13-week program for advanced surfers. 3 gym sessions, 3 surf sessions, 1 softball night, and alt activities for flat days.
          </p>
          <p style={{ marginBottom: '4px' }}>
            Built for tight hips and knees that need attention.
          </p>
          <p style={{ marginTop: '12px', color: '#555', fontSize: '11px' }}>
            Sources: Cris Mills (CSCS) · Cody Thompson (CPT) · The Inertia · Jaco Rehab · Waterboyz · Again Faster · SurferToday · Renegade Surf Travel · Dr. Tim Brown (ESPN/Slater).
          </p>
        </div>
      </div>

      {/* PWA install hint */}
      <div style={sectionStyle}>
        <div style={labelStyle}>INSTALL ON YOUR PHONE</div>
        <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '4px' }}>
            <strong style={{ color: '#ccc' }}>iPhone:</strong> Tap the Share button (📤) in Safari, then "Add to Home Screen."
          </p>
          <p>
            <strong style={{ color: '#ccc' }}>Android:</strong> Tap the browser menu (⋮), then "Install app" or "Add to Home screen."
          </p>
        </div>
      </div>
    </div>
  );
}
