const HudRings = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <svg
        className="absolute w-[340px] h-[340px] md:w-[520px] md:h-[520px] animate-[hud-rotate_60s_linear_infinite]"
        viewBox="0 0 520 520"
        fill="none"
      >
        <circle
          cx="260"
          cy="260"
          r="250"
          stroke="#00d4ff"
          strokeWidth="1"
          strokeDasharray="12 8 4 8"
          opacity="0.3"
        />
        {/* Tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const x1 = 260 + 244 * Math.cos(angle);
          const y1 = 260 + 244 * Math.sin(angle);
          const x2 = 260 + 250 * Math.cos(angle);
          const y2 = 260 + 250 * Math.sin(angle);
          return (
            <line
              key={`outer-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00d4ff"
              strokeWidth={i % 3 === 0 ? 2 : 0.5}
              opacity={i % 3 === 0 ? 0.6 : 0.25}
            />
          );
        })}
        {/* Accent dots */}
        {[0, 90, 180, 270].map((deg) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <circle
              key={`dot-outer-${deg}`}
              cx={260 + 250 * Math.cos(angle)}
              cy={260 + 250 * Math.sin(angle)}
              r="3"
              fill="#00d4ff"
              opacity="0.8"
              className="animate-[hud-glow-pulse_2s_ease-in-out_infinite]"
            />
          );
        })}
      </svg>

      {/* Middle ring */}
      <svg
        className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] animate-[hud-rotate-reverse_40s_linear_infinite]"
        viewBox="0 0 420 420"
        fill="none"
      >
        <circle
          cx="210"
          cy="210"
          r="200"
          stroke="#7b61ff"
          strokeWidth="1.5"
          strokeDasharray="20 5 5 5"
          opacity="0.35"
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 210 + 193 * Math.cos(angle);
          const y1 = 210 + 193 * Math.sin(angle);
          const x2 = 210 + 200 * Math.cos(angle);
          const y2 = 210 + 200 * Math.sin(angle);
          return (
            <line
              key={`mid-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#7b61ff"
              strokeWidth={i % 4 === 0 ? 2 : 0.5}
              opacity={i % 4 === 0 ? 0.6 : 0.2}
            />
          );
        })}
        {[45, 135, 225, 315].map((deg) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <circle
              key={`dot-mid-${deg}`}
              cx={210 + 200 * Math.cos(angle)}
              cy={210 + 200 * Math.sin(angle)}
              r="2.5"
              fill="#7b61ff"
              opacity="0.7"
              className="animate-[hud-glow-pulse_3s_ease-in-out_infinite]"
            />
          );
        })}
      </svg>

      {/* Inner ring */}
      <svg
        className="absolute w-[220px] h-[220px] md:w-[330px] md:h-[330px] animate-[hud-rotate_20s_linear_infinite]"
        viewBox="0 0 330 330"
        fill="none"
      >
        <circle
          cx="165"
          cy="165"
          r="155"
          stroke="#00d4ff"
          strokeWidth="0.8"
          strokeDasharray="3 6"
          opacity="0.2"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <circle
              key={`inner-${i}`}
              cx={165 + 155 * Math.cos(angle)}
              cy={165 + 155 * Math.sin(angle)}
              r="1.5"
              fill="#00d4ff"
              opacity="0.5"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default HudRings;
