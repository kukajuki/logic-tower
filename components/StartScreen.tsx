"use client";

import { S } from "@/lib/styles";
import { LEVELS, LEVEL_INFO, Level, isLevelReady } from "@/lib/questions";

interface StartScreenProps {
  level: Level | null;
  onSelectLevel: (level: Level) => void;
  onStart: () => void;
  onOpenStats: () => void;
  totalPlays: number;
}

const LEVEL_BORDER: Record<Level, string> = {
  1: "#F59E0B",
  2: "#3B82F6",
  3: "#EF4444",
};

export default function StartScreen({
  level,
  onSelectLevel,
  onStart,
  onOpenStats,
  totalPlays,
}: StartScreenProps) {
  const selectedReady = level !== null && isLevelReady(level);

  return (
    <div style={S.container}>
      <div style={S.startScreen}>
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 8 }}>
          <rect x="24" y="4" width="16" height="12" rx="2" fill="#F59E0B" opacity="0.9" />
          <rect x="12" y="20" width="18" height="12" rx="2" fill="#3B82F6" opacity="0.9" />
          <rect x="34" y="20" width="18" height="12" rx="2" fill="#3B82F6" opacity="0.9" />
          <rect x="2" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" />
          <rect x="23" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" />
          <rect x="44" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" />
        </svg>
        <h1 style={S.title}>LOGIC TOWER</h1>
        <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, letterSpacing: 2 }}>
          イシューから始める思考訓練
        </p>

        <div style={{ width: "100%", maxWidth: 340, marginTop: 24 }}>
          {LEVELS.map((lv) => {
            const info = LEVEL_INFO[lv];
            const ready = isLevelReady(lv);
            const selected = level === lv;
            const borderColor = LEVEL_BORDER[lv];
            return (
              <div
                key={lv}
                onClick={() => onSelectLevel(lv)}
                style={{
                  ...S.modeCard,
                  marginTop: lv === 1 ? 0 : 8,
                  border: selected
                    ? `2px solid ${borderColor}`
                    : "1.5px solid #334155",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>
                    {info.emoji} {info.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: ready ? "#64748B" : "#F59E0B",
                    }}
                  >
                    {ready ? `${info.expectedSize}問` : `🚧 準備中（${info.expectedSize}問予定）`}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                    margin: "6px 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>

        <button
          style={{
            ...S.primaryButton,
            marginTop: 20,
            opacity: selectedReady ? 1 : 0.4,
            cursor: selectedReady ? "pointer" : "default",
          }}
          onClick={() => selectedReady && onStart()}
        >
          START
        </button>

        {level !== null && !isLevelReady(level) && (
          <p style={{ fontSize: 10, color: "#F59E0B", marginTop: 8 }}>
            このレベルは現在準備中です
          </p>
        )}

        {totalPlays > 0 && (
          <button style={{ ...S.secondaryButton, marginTop: 10 }} onClick={onOpenStats}>
            📈 成長グラフ
          </button>
        )}
        {totalPlays > 0 && (
          <p style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>
            累計{totalPlays}回プレイ
          </p>
        )}
      </div>
    </div>
  );
}
