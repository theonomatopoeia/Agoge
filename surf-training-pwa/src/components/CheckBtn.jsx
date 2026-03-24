/**
 * Circular checkbox button with animated check icon.
 * Used for marking activities complete.
 */
export function CheckBtn({ checked, onClick, size = 20, color = '#00d4aa' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: checked ? `2px solid ${color}` : '2px solid #333',
        backgroundColor: checked ? color : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {checked && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-6"
            stroke="#08080c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
