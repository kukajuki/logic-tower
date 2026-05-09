"use client";

import { useMemo, useState } from "react";
import { Question } from "@/lib/types";
import { S } from "@/lib/styles";

interface IssueSelectionProps {
  question: Question;
  onPick: (chosenIssue: string, isCorrect: boolean) => void;
  onBack: () => void;
}

interface Choice {
  text: string;
  isCorrect: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function IssueSelection({
  question,
  onPick,
  onBack,
}: IssueSelectionProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const choices = useMemo<Choice[]>(() => {
    const sel = question.issueSelection;
    if (!sel) {
      return [{ text: question.issue, isCorrect: true }];
    }
    return shuffle([
      { text: sel.correctIssue, isCorrect: true },
      ...sel.wrongIssues.map((w) => ({ text: w.text, isCorrect: false })),
    ]);
    // shuffle on mount only — keep choices stable while user is deciding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const confirm = () => {
    if (!chosen) return;
    const choice = choices.find((c) => c.text === chosen);
    if (!choice) return;
    onPick(choice.text, choice.isCorrect);
  };

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
              color: "#3B82F6",
              margin: 0,
            }}
          >
            🎯 イシュー選択
          </h2>
          <button onClick={onBack} style={S.backButton}>
            戻る
          </button>
        </div>

        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#F59E0B",
            margin: "0 0 4px",
          }}
        >
          {question.title}
        </p>
        <p
          style={{
            fontSize: 11,
            lineHeight: 1.6,
            color: "#94A3B8",
            margin: "0 0 12px",
          }}
        >
          {question.situation}
        </p>

        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#E2E8F0",
            margin: "0 0 6px",
            padding: "8px 10px",
            backgroundColor: "#1E293B",
            borderRadius: 6,
            borderLeft: "3px solid #3B82F6",
            lineHeight: 1.6,
          }}
        >
          この状況で、最も答えを出す価値がある問いはどれか？
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 10,
          }}
        >
          {choices.map((c, i) => {
            const selected = chosen === c.text;
            return (
              <div
                key={i}
                onClick={() => setChosen(c.text)}
                style={{
                  padding: "10px 12px",
                  backgroundColor: selected ? "#3B82F611" : "#1E293B",
                  borderRadius: 8,
                  border: `1.5px solid ${selected ? "#3B82F6" : "#334155"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  ...(selected ? { boxShadow: "0 0 0 1px #3B82F644" } : {}),
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: selected ? "#3B82F6" : "#475569",
                    flexShrink: 0,
                    width: 18,
                    paddingTop: 1,
                  }}
                >
                  {selected ? "●" : "○"}
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
          💡 答えを出す価値のある問い = 自社で意思決定でき、スコープが適切で、本来の課題に直結している問い
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
            background: "linear-gradient(135deg,#3B82F6,#6366F1)",
            border: "none",
            borderRadius: 6,
            cursor: chosen ? "pointer" : "default",
            opacity: chosen ? 1 : 0.4,
          }}
          onClick={confirm}
          disabled={!chosen}
        >
          この問いで進む
        </button>
      </div>
    </div>
  );
}
