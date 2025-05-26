export function WindyIcon({ className }: { className?: string }) {
  const windLines = [
    { d: "M15 25 Q25 20 35 25 T55 25", delay: "0s" },
    { d: "M10 35 Q20 30 30 35 T50 35", delay: "0.2s" },
    { d: "M20 45 Q30 40 40 45 T60 45", delay: "0.4s" },
  ];
  return (
    <svg 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))" }}
    >
      {windLines.map((line, i) => (
        <path
          key={i}
          d={line.d}
          fill="none"
          stroke="hsl(var(--primary) / 0.7)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            animation: `slide 1.5s ease-in-out infinite ${line.delay}`,
          }}
        />
      ))}
    </svg>
  );
}
