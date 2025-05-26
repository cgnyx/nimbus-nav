export function FoggyIcon({ className }: { className?: string }) {
  const fogLayers = [
    { d: "M10 30 H54", opacity: 0.3, delay: "0s", duration: "5s" },
    { d: "M5 38 H59", opacity: 0.4, delay: "0.5s", duration: "5.5s" },
    { d: "M12 46 H52", opacity: 0.35, delay: "0.2s", duration: "4.5s" },
  ];
  return (
    <svg 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))" }}
    >
      {fogLayers.map((layer, i) => (
        <path
          key={i}
          d={layer.d}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.7)"
          strokeWidth="8" // Thicker lines for fog
          strokeLinecap="round"
          style={{
            opacity: layer.opacity,
            animation: `slide ${layer.duration} ease-in-out infinite alternate ${layer.delay}`,
          }}
        />
      ))}
    </svg>
  );
}
