import { useState, useEffect, useRef } from "react";

const logMessages = [
  "[SYS] Initializing RotaSmart v3.7...",
  "[NET] Establishing secure connection...",
  "[NET] Connection secure — TLS 1.3",
  "[SYS] Loading authentication module...",
  "[AUTH] Awaiting credentials...",
  "[SYS] HUD interface rendered",
  "[NET] Latency: 12ms — Status: OPTIMAL",
  "[SYS] Diagnostic scan complete",
  "[AUTH] Session monitor active",
  "[SYS] Route optimization engine standby",
  "[NET] Heartbeat: OK",
  "[SYS] Memory allocation: nominal",
  "[AUTH] Encryption layer: AES-256",
  "[SYS] GPS module: ready",
  "[NET] Sync protocol: active",
];

const HudTerminal = () => {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Start with first 3 lines
    setLines(logMessages.slice(0, 3));
    indexRef.current = 3;

    const interval = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, logMessages[indexRef.current % logMessages.length]];
        indexRef.current++;
        return next.slice(-8); // keep last 8
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="w-full max-w-sm md:max-w-md">
      <div className="flex items-center gap-2 mb-1 text-[9px] md:text-[10px] font-mono text-[#00ff88]/50">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-[hud-glow-pulse_1.5s_ease-in-out_infinite]" />
        SYSTEM LOG — LIVE
      </div>
      <div
        ref={scrollRef}
        className="bg-black/40 border border-[#00ff88]/10 rounded-lg p-3 h-[120px] md:h-[140px] overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {lines.map((line, i) => (
          <div
            key={`${i}-${line}`}
            className="font-mono text-[10px] md:text-xs leading-relaxed animate-[hud-terminal-line_0.3s_ease-out]"
            style={{
              color: line.includes("[AUTH]")
                ? "#00d4ff"
                : line.includes("[NET]")
                ? "#7b61ff"
                : "#00ff88",
              opacity: i === lines.length - 1 ? 1 : 0.6,
            }}
          >
            {line}
          </div>
        ))}
        <span className="inline-block w-1.5 h-3 bg-[#00ff88] animate-[hud-cursor-blink_1s_steps(1)_infinite] ml-0.5" />
      </div>
    </div>
  );
};

export default HudTerminal;
