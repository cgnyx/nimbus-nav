export function RainyIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))" }}
    >
      <g>
        <path 
          d="M46.3,26.7c-0.6-6.9-6.4-12.3-13.4-12.3c-5.7,0-10.6,3.5-12.6,8.5c-0.4-0.1-0.8-0.1-1.3-0.1c-5.8,0-10.5,4.7-10.5,10.5   s4.7,10.5,10.5,10.5H46c4.9,0,8.8-4,8.8-8.8C54.8,30.8,51.1,27.2,46.3,26.7z" 
          fill="hsl(var(--secondary-foreground) / 0.5)" 
          stroke="hsl(var(--secondary-foreground) / 0.7)" 
          strokeWidth="1.5"
        />
      </g>
      <g>
        {[...Array(3)].map((_, i) => (
          <line
            key={`drop-1-${i}`}
            x1={24 + i * 8}
            y1="45"
            x2={24 + i * 8}
            y2="55"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              animation: `fall 1s linear infinite ${i * 0.2}s`,
              transformOrigin: `${24 + i * 8}px 45px`,
            }}
          />
        ))}
        {[...Array(2)].map((_, i) => (
           <line
            key={`drop-2-${i}`}
            x1={28 + i * 8}
            y1="50"
            x2={28 + i * 8}
            y2="60"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              animation: `fall 1s linear infinite ${0.1 + i * 0.2}s`,
              transformOrigin: `${28 + i * 8}px 50px`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
