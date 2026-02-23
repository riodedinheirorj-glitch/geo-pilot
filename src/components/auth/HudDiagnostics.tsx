import { useState, useEffect } from "react";

const metrics = [
  { label: "CPU", unit: "%" },
  { label: "MEM", unit: "%" },
  { label: "NET", unit: "ms" },
];

const statuses = [
  { label: "ONLINE", color: "#00ff88" },
  { label: "SECURE", color: "#00d4ff" },
  { label: "SYNCED", color: "#7b61ff" },
];

const HudDiagnostics = () => {
  const [values, setValues] = useState([42, 67, 12]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues([
        Math.floor(Math.random() * 30) + 30,
        Math.floor(Math.random() * 25) + 55,
        Math.floor(Math.random() * 20) + 8,
      ]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] md:text-xs space-y-3 w-full max-w-[160px] md:max-w-[180px]">
      {/* Status indicators */}
      <div className="flex flex-wrap gap-2 mb-3">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-[hud-glow-pulse_2s_ease-in-out_infinite]"
              style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }}
            />
            <span style={{ color: s.color }} className="opacity-80">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Metric bars */}
      {metrics.map((m, i) => (
        <div key={m.label} className="space-y-1">
          <div className="flex justify-between text-[#00d4ff]/60">
            <span>{m.label}</span>
            <span>
              {values[i]}
              {m.unit}
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${m.unit === "ms" ? Math.min(values[i] * 2.5, 100) : values[i]}%`,
                background:
                  i === 0
                    ? "#00d4ff"
                    : i === 1
                    ? "#7b61ff"
                    : "#00ff88",
                boxShadow: `0 0 8px ${i === 0 ? "#00d4ff" : i === 1 ? "#7b61ff" : "#00ff88"}`,
              }}
            />
          </div>
        </div>
      ))}

      {/* System info */}
      <div className="mt-3 pt-2 border-t border-white/5 text-[#00d4ff]/40 space-y-0.5 text-[9px]">
        <div>SYS: ROTASMART v3.7.2</div>
        <div>PID: {Math.floor(Math.random() * 9000) + 1000}</div>
        <div>UPTIME: 99.97%</div>
      </div>
    </div>
  );
};

export default HudDiagnostics;
