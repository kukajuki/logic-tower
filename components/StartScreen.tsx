"use client";

import { S } from "@/lib/styles";
import { UNLOCK_PLAYS } from "@/lib/constants";

export type Mode = "basic" | "practice";

interface StartScreenProps {
  mode: Mode | null;
  onSelectMode: (mode: Mode) => void;
  onStart: () => void;
  onOpenStats: () => void;
  totalPlays: number;
}

export default function StartScreen({
  mode,
  onSelectMode,
  onStart,
  onOpenStats,
  totalPlays,
}: StartScreenProps) {
  const practiceUnlocked = totalPlays >= UNLOCK_PLAYS;

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
          <div
            onClick={() => onSelectMode("basic")}
            style={{
              ...S.modeCard,
              border: mode === "basic" ? "2px solid #F59E0B" : "1.5px solid #334155",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>📚 基礎編</span>
              <span style={{ fontSize: 10, color: "#64748B" }}>厳選5問</span>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#94A3B8",
                margin: "6px 0 0",
                lineHeight: 1.5,
              }}
            >
              品質保証された問題で「型」を覚える
            </p>
          </div>

          <div
            style={{
              ...S.modeCard,
              marginTop: 8,
              border: "1.5px solid #334155",
              opacity: 0.45,
              cursor: "default",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>🏋️ 実践編</span>
              {practiceUnlocked ? (
                <span style={{ fontSize: 10, color: "#64748B" }}>🚧 準備中</span>
              ) : (
                <span style={{ fontSize: 10, color: "#64748B" }}>
                  🔒 あと{UNLOCK_PLAYS - totalPlays}回でアンロック
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#94A3B8",
                margin: "6px 0 0",
                lineHeight: 1.5,
              }}
            >
              {practiceUnlocked
                ? "100問の実践問題は近日公開"
                : "基礎編を5回プレイすると解放されます"}
            </p>
          </div>
        </div>

        <button
          style={{
            ...S.primaryButton,
            marginTop: 20,
            opacity: mode ? 1 : 0.4,
            cursor: mode ? "pointer" : "default",
          }}
          onClick={() => mode && onStart()}
        >
          START
        </button>

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
