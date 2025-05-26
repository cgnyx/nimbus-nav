export function PartlyCloudyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))" }}
    >
      {/* Sun */}
      <circle cx="26" cy="26" r="10" fill="hsl(var(--accent))" />
      <g style={{ animation: "spin 12s linear infinite", transformOrigin: "26px 26px" }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={`sunray-${angle}`}
            x1="26"
            y1="26"
            x2="26"
            y2="6"
            stroke="hsl(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${angle} 26 26)`}
          />
        ))}
      </g>
      {/* Cloud */}
      <g style={{ animation: "float 7s ease-in-out infinite" , transform: "translateX(5px) translateY(5px)"}}>
        <path
          d="M46.3,33.7c-0.6-6.9-6.4-12.3-13.4-12.3c-5.7,0-10.6,3.5-12.6,8.5c-0.4-0.1-0.8-0.1-1.3-0.1c-5.8,0-10.5,4.7-10.5,10.5s4.7,10.5,10.5,10.5H46c4.9,0,8.8-4,8.8-8.8C54.8,37.8,51.1,34.2,46.3,33.7z"
          fill="hsl(var(--secondary-foreground) / 0.6)"
          stroke="hsl(var(--secondary-foreground) / 0.8)"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
