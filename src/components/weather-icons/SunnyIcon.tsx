export function SunnyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(255, 172, 51, 0.5))" }}
    >
      <circle cx="32" cy="32" r="12" fill="hsl(var(--accent))" />
      <g style={{ animation: "spin 10s linear infinite", transformOrigin: "center" }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="32"
            y1="32"
            x2="32"
            y2="8"
            stroke="hsl(var(--accent))"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 32 32)`}
          />
        ))}
      </g>
    </svg>
  );
}
