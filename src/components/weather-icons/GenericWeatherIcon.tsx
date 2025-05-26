export function GenericWeatherIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))" }}
    >
      <circle 
        cx="32" 
        cy="32" 
        r="18" 
        fill="hsl(var(--muted) / 0.5)" 
        stroke="hsl(var(--muted-foreground) / 0.7)" 
        strokeWidth="1.5" 
      />
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontSize="20" 
        fontFamily="Arial, sans-serif" 
        fill="hsl(var(--foreground))"
        dy=".1em"
      >
        ?
      </text>
    </svg>
  );
}
