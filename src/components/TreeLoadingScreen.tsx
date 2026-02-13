export function TreeLoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B1210',
        zIndex: 9999,
      }}
    >
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Ghost tree (outline) */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
        >
          <path
            d="M32 4C28 12 16 18 16 28c0 6 4 10 8 12v16h16V40c4-2 8-6 8-12C48 18 36 12 32 4z"
            fill="#fff"
          />
          <rect x="28" y="52" width="8" height="8" rx="1" fill="#fff" />
        </svg>

        {/* Filling tree */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            animation: 'tree-fill 1.8s ease-in-out infinite',
          }}
        >
          <path
            d="M32 4C28 12 16 18 16 28c0 6 4 10 8 12v16h16V40c4-2 8-6 8-12C48 18 36 12 32 4z"
            fill="#5A6E4B"
          />
          <rect x="28" y="52" width="8" height="8" rx="1" fill="#5A6E4B" />
        </svg>
      </div>

      <style>{`
        @keyframes tree-fill {
          0% { clip-path: inset(100% 0 0 0); }
          50% { clip-path: inset(0% 0 0 0); }
          100% { clip-path: inset(100% 0 0 0); }
        }
      `}</style>
    </div>
  );
}
