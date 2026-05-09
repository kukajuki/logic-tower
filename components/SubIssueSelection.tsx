"use client";

import { useMemo, useState } from "react";
import { Question } from "@/lib/types";
import { S } from "@/lib/styles";

interface SubIssueSelectionProps {
  question: Question;
  /** Issue chosen on the previous screen — shown as context. */
  chosenIssue: string;
  /** Up to 2 candidate texts the player picks. */
  onPick: (chosenTexts: string[]) => void;
  onBack: () => void;
}

interface Candidate {
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function SubIssueSelection({
  question,
  chosenIssue,
  onPick,
  onBack,
}: SubIssueSelectionProps) {
  const candidates = useMemo<Candidate[]>(() => {
    const sel = question.subIssueSelection;
    if (!sel) return [];
    return shuffle(sel.candidates.map((c) => ({ text: c.text })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const [picked, setPicked] = useState<string[]>([]);

  const togglePick = (text: string) => {
    setPicked((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text);
      if (prev.length >= 2) return prev; // cap at 2
      return [...prev, text];
    });
  };

  const ready = picked.length === 2;

  return (
    <div style={S.container}>
      <div style={{ padding: "20px 14px 100px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#EF4444",
              margin: 0,
            }}
          >
            🧩 サブイシュー選択
          </h2>
          <button onClick={onBack} style={S.backButton}>
            戻る
          </button>
        </div>

        <p
          style={{
            fontSize: 11,
            color: "#94A3B8",
            margin: "0 0 6px",
          }}
        >
          イシュー
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#E2E8F0",
            margin: "0 0 12px",
            padding: "8px 10px",
            backgroundColor: "#1E293B",
            borderRadius: 6,
            borderLeft: "3px solid #F59E0B",
            lineHeight: 1.6,
          }}
        >
          💡 {chosenIssue}
        </p>

        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#E2E8F0",
            margin: "0 0 4px",
            lineHeight: 1.6,
          }}
        >
          このイシューに答えるために、まず何を明らかにすべきか？
        </p>
        <p
          style={{
            fontSize: 10,
            color: "#94A3B8",
            margin: "0 0 10px",
          }}
        >
          5つの問いから、最も重要な2つを選べ。
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {candidates.map((c, i) => {
            const isSelected = picked.includes(c.text);
            const order = picked.indexOf(c.text); // 0 or 1
            return (
              <div
                key={i}
                onClick={() => togglePick(c.text)}
                style={{
                  padding: "10px 12px",
                  backgroundColor: isSelected ? "#EF444411" : "#1E293B",
                  borderRadius: 8,
                  border: `1.5px solid ${isSelected ? "#EF4444" : "#334155"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  ...(isSelected ? { boxShadow: "0 0 0 1px #EF444444" } : {}),
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: isSelected ? "#EF4444" : "#475569",
                    flexShrink: 0,
                    width: 22,
                    paddingTop: 1,
                  }}
                >
                  {isSelected ? `${order + 1}` : "□"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "#E2E8F0",
                    flex: 1,
                  }}
                >
                  {c.text}
                </span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontSize: 9,
            color: "#64748B",
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          💡 良いサブイシュー = 結論を直接支える問い／自社で答えが出せる／実行詳細ではなく判断軸
        </p>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 10px",
          backgroundColor: "#0F172Aee",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <button
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "10px",
            fontSize: 13,
            fontWeight: 700,
            color: "#0F172A",
            background: "linear-gradient(135deg,#EF4444,#F59E0B)",
            border: "none",
            borderRadius: 6,
            cursor: ready ? "pointer" : "default",
            opacity: ready ? 1 : 0.4,
          }}
          onClick={() => ready && onPick(picked)}
          disabled={!ready}
        >
          この2つで進む（{picked.length}/2）
        </button>
      </div>
    </div>
  );
}
