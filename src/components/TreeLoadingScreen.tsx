import datonIcon from "@/assets/daton-icon.png";

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
        {/* Ghost icon */}
        <img
          src={datonIcon}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.15,
          }}
        />
        {/* Filling icon */}
        <img
          src={datonIcon}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: 'tree-fill 1.8s ease-in-out infinite',
            filter: 'brightness(0) saturate(100%) invert(42%) sepia(10%) saturate(1200%) hue-rotate(70deg) brightness(95%) contrast(85%)',
          }}
        />
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
