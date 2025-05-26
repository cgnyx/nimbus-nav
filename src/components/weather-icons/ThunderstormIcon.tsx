export function ThunderstormIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
    >
      <g>
        <path 
          d="M46.3,26.7c-0.6-6.9-6.4-12.3-13.4-12.3c-5.7,0-10.6,3.5-12.6,8.5c-0.4-0.1-0.8-0.1-1.3-0.1c-5.8,0-10.5,4.7-10.5,10.5   s4.7,10.5,10.5,10.5H46c4.9,0,8.8-4,8.8-8.8C54.8,30.8,51.1,27.2,46.3,26.7z" 
          fill="hsl(var(--secondary-foreground) / 0.7)"  /* Darker cloud for storm */
          stroke="hsl(var(--secondary-foreground) / 0.9)" 
          strokeWidth="1.5"
        />
      </g>
      {/* Lightning Bolt */}
      <polygon
        points="32,38 26,48 34,48 28,58"
        fill="hsl(var(--accent))"
        stroke="hsl(var(--accent) / 0.8)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{
          animation: `flash 1.5s linear infinite`,
          filter: "drop-shadow(0 0 5px hsl(var(--accent)))"
        }}
      />
    </svg>
  );
}
