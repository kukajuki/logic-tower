"use client";

interface TimerProps {
  remaining: number;
  total: number;
}

export default function Timer({ remaining, total }: TimerProps) {
  const ratio = total > 0 ? remaining / total : 0;
  const color = remaining <= 15 ? "#EF4444" : remaining <= 30 ? "#F59E0B" : "#22C55E";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 30,
        backgroundColor: "#1E293B",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          opacity: 0.15,
          width: `${ratio * 100}%`,
          backgroundColor: color,
          transition: "width 1s linear",
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: "#E2E8F0",
          zIndex: 1,
          marginLeft: "auto",
        }}
      >
        {remaining}s
      </span>
    </div>
  );
}
