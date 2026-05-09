"use client";

import { useState } from "react";
import { Question, Slots } from "@/lib/types";
import { Phase1Result, rankFor } from "@/lib/scoring";
import { buildNarrative, userReading } from "@/lib/narrative";
import { POSITION_LABELS, TIER_COLORS, TIER_LABELS, TIER_SLOTS } from "@/lib/constants";
import { S } from "@/lib/styles";

interface ResultPhase1Props {
  question: Question;
  slots: Slots;
  result: Phase1Result;
  onNext: () => void;
  onOpenStats: () => void;
  onHome: () => void;
}

export default function ResultPhase1({
  question,
  slots,
  result,
  onNext,
  onOpenStats,
  onHome,
}: ResultPhase1Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const grade = rankFor(result.score);
  const narrative = buildNarrative(question.phase1, slots);
  const reading = userReading(question.phase1, slots);

  const phase1 = question.phase1;

  return (
    <div style={S.container}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "22px 12px",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#64748B",
            marginBottom: 10,
          }}
        >
          RESULT
        </p>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: `3px solid ${grade.color}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 800, color: grade.color }}>{grade.label}</span>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>{result.score}</span>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "8px 10px",
            backgroundColor: "#1E293B",
            borderRadius: 7,
            display: "flex",
            justifyContent: "space-around",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ fontSize: 8, color: "#64748B", margin: 0 }}>一致</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
              {result.accuracy}/6
            </p>
          </div>
          {TIER_LABELS.map((label, i) => (
            <div key={i}>
              <p style={{ fontSize: 8, color: TIER_COLORS[i], margin: 0 }}>{label}</p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: result.tierScores[i] === TIER_SLOTS[i] ? "#22C55E" : "#E2E8F0",
                  margin: 0,
                }}
              >
                {result.tierScores[i]}/{TIER_SLOTS[i]}
              </p>
            </div>
          ))}
          <div>
            <p style={{ fontSize: 8, color: "#64748B", margin: 0 }}>時間+</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
              {result.timeBonus}
            </p>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 400, marginTop: 16 }}>
          <div style={{ ...S.narrativeBox, borderLeftColor: "#F59E0B" }}>
            <p style={S.narrativeTitle}>🔍 あなたの構造を読むと…</p>
            {reading && (
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: "#CBD5E1",
                  margin: "0 0 10px",
                  fontStyle: "italic",
                }}
              >
                {reading}
              </p>
            )}
            {narrative.map((n, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: 6,
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>
                  {n.kind === "o" ? "✅" : n.kind === "s" ? "🔄" : n.kind === "p" ? "⚡" : "❌"}
                </span>
                <p
                  style={{
                    fontSize: 11,
                    lineHeight: 1.7,
                    color:
                      n.kind === "o"
                        ? "#86EFAC"
                        : n.kind === "x"
                        ? "#FCA5A5"
                        : "#FDE68A",
                    margin: 0,
                  }}
                >
                  {n.message}
                </p>
              </div>
            ))}
          </div>

          {result.argSwap && phase1.narrative?.argSwap && (
            <div style={{ ...S.narrativeBox, borderLeftColor: "#8B5CF6", marginTop: 10 }}>
              <p style={S.narrativeTitle}>🔄 左右が逆だとどう読める？</p>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.8,
                  color: "#FDE68A",
                  margin: "0 0 8px",
                }}
              >
                {phase1.narrative.argSwap.reading}
              </p>
              <div style={{ backgroundColor: "#0F172A", borderRadius: 7, padding: 10 }}>
                <p
                  style={{
                    fontSize: 10,
                    lineHeight: 1.8,
                    color: "#94A3B8",
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {phase1.narrative.argSwap.contrast}
                </p>
              </div>
            </div>
          )}

          {phase1.narrative?.correctReading && (
            <div style={{ ...S.narrativeBox, borderLeftColor: "#22C55E", marginTop: 10 }}>
              <p style={S.narrativeTitle}>✨ 模範構造はこう読める</p>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.8,
                  color: "#86EFAC",
                  margin: 0,
                }}
              >
                {phase1.narrative.correctReading}
              </p>
            </div>
          )}

          {!result.argSwap && result.tierScores[1] < 2 && phase1.narrative?.argSwap && (
            <div style={{ ...S.narrativeBox, borderLeftColor: "#8B5CF6", marginTop: 10 }}>
              <p style={S.narrativeTitle}>💡 論点の順序はなぜ重要か？</p>
              <div style={{ backgroundColor: "#0F172A", borderRadius: 7, padding: 10 }}>
                <p
                  style={{
                    fontSize: 10,
                    lineHeight: 1.8,
                    color: "#94A3B8",
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {phase1.narrative.argSwap.contrast}
                </p>
              </div>
            </div>
          )}

          <p style={{ ...S.narrativeTitle, marginTop: 16, marginBottom: 6 }}>📐 スロット別詳細</p>
          {[0, 1, 2].map((tier) => (
            <div key={tier} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 2,
                    padding: "1px 6px",
                    borderRadius: 3,
                    backgroundColor: TIER_COLORS[tier] + "22",
                    color: TIER_COLORS[tier],
                  }}
                >
                  {TIER_LABELS[tier]}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color:
                      result.tierScores[tier] === TIER_SLOTS[tier] ? "#22C55E" : "#EF4444",
                  }}
                >
                  {result.tierScores[tier] === TIER_SLOTS[tier]
                    ? "✓"
                    : `${result.tierScores[tier]}/${TIER_SLOTS[tier]}`}
                </span>
              </div>
              <p
                style={{
                  fontSize: 9,
                  lineHeight: 1.6,
                  color: "#64748B",
                  margin: "0 0 3px",
                }}
              >
                {phase1.explanation?.tiers?.[tier]}
              </p>
              {Array.from({ length: TIER_SLOTS[tier] }).map((_, i) => {
                const sid = `t${tier}-${i}`;
                const correctCid = phase1.correctSlots[sid];
                const correctCard = phase1.cards.find((c) => c.id === correctCid);
                const exact = slots[sid] === correctCid;
                const swapped =
                  !exact &&
                  (sid === "t2-1" || sid === "t2-2") &&
                  result.evSwap;
                const ok = exact || swapped;
                const ekey = `r-${sid}`;
                const isOpen = expanded === ekey;
                const userReport = result.cardReport[correctCid];
                let detailLine: string | null = null;
                if (swapped) {
                  detailLine = "中央と右が入れ替わっていますが、補強と反証は対等なので正解扱い";
                } else if (!ok) {
                  if (userReport) {
                    const posIdx = parseInt(userReport.placedSlot.split("-")[1] ?? "0", 10);
                    detailLine = `あなたは「${TIER_LABELS[userReport.placedTier]}の${POSITION_LABELS[posIdx]}」に配置`;
                  } else {
                    detailLine = "未配置";
                  }
                  const placedHere = slots[sid];
                  if (placedHere) {
                    const wc = phase1.cards.find((c) => c.id === placedHere);
                    if (wc) {
                      const phrase = wc.phrase || (wc.text?.slice(0, 15) ?? "");
                      detailLine += ` ／ ここには「${phrase}」`;
                    }
                  }
                }
                const positionLabel = TIER_SLOTS[tier] > 1 ? `（${POSITION_LABELS[i]}）` : "";
                return (
                  <div key={sid} style={{ marginBottom: 3 }}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : ekey)}
                      style={{
                        padding: "7px 9px",
                        backgroundColor: "#1E293B",
                        borderRadius: 6,
                        borderLeft: `3px solid ${ok ? "#22C55E" : "#EF4444"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: ok ? "#22C55E" : "#EF4444",
                            marginRight: 4,
                            flexShrink: 0,
                          }}
                        >
                          {ok ? "✓" : "✗"}
                        </span>
                        <span style={{ fontSize: 9, lineHeight: 1.5, color: "#CBD5E1", flex: 1 }}>
                          {positionLabel && (
                            <span style={{ color: "#64748B", fontSize: 8 }}>{positionLabel} </span>
                          )}
                          {correctCard?.text}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            color: "#64748B",
                            marginLeft: 2,
                            flexShrink: 0,
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        >
                          ▼
                        </span>
                      </div>
                      {detailLine && (
                        <span
                          style={{
                            display: "block",
                            fontSize: 8,
                            color: "#F59E0B",
                            marginTop: 2,
                            paddingLeft: 14,
                          }}
                        >
                          → {detailLine}
                        </span>
                      )}
                    </div>
                    {isOpen && correctCard?.reason && (
                      <div
                        style={{
                          padding: "7px 9px 7px 12px",
                          marginTop: 1,
                          backgroundColor: "#334155",
                          borderRadius: "0 0 6px 6px",
                          borderLeft: "3px solid #475569",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            lineHeight: 1.7,
                            color: "#94A3B8",
                            margin: 0,
                          }}
                        >
                          <strong style={{ color: "#CBD5E1" }}>なぜこの位置か：</strong>
                          {correctCard.reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {(() => {
            const correctArgIds = new Set([
              phase1.correctSlots["t1-0"],
              phase1.correctSlots["t1-1"],
            ]);
            const offCoreArgs = phase1.cards.filter(
              (c) => c.type === "argument" && !correctArgIds.has(c.id),
            );
            if (offCoreArgs.length === 0) return null;
            return (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 2,
                      padding: "1px 6px",
                      borderRadius: 3,
                      backgroundColor: "#3B82F622",
                      color: "#3B82F6",
                    }}
                  >
                    核心ではない論点
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#94A3B8",
                    }}
                  >
                    優先度低
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 9,
                    lineHeight: 1.6,
                    color: "#64748B",
                    margin: "0 0 3px",
                  }}
                >
                  関連はあるが、このイシューの核心ではないサブイシュー。
                </p>
                {offCoreArgs.map((card) => {
                  const placed = !!result.cardReport[card.id];
                  const ekey = `oc-${card.id}`;
                  const isOpen = expanded === ekey;
                  return (
                    <div key={card.id} style={{ marginBottom: 3 }}>
                      <div
                        onClick={() => setExpanded(isOpen ? null : ekey)}
                        style={{
                          padding: "7px 9px",
                          backgroundColor: "#1E293B",
                          borderRadius: 6,
                          borderLeft: `3px solid ${
                            placed ? "#FDE68A" : "#22C55E"
                          }`,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: placed ? "#FDE68A" : "#22C55E",
                              marginRight: 4,
                              flexShrink: 0,
                            }}
                          >
                            {placed ? "△" : "✓"}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              lineHeight: 1.5,
                              color: "#CBD5E1",
                              flex: 1,
                            }}
                          >
                            {card.text}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              color: "#64748B",
                              marginLeft: 2,
                              flexShrink: 0,
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          >
                            ▼
                          </span>
                        </div>
                        {placed && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 8,
                              color: "#FDE68A",
                              marginTop: 2,
                              paddingLeft: 14,
                            }}
                          >
                            → 論点スロットに配置されました（核心の問いと差し替え推奨）
                          </span>
                        )}
                      </div>
                      {isOpen && card.reason && (
                        <div
                          style={{
                            padding: "7px 9px 7px 12px",
                            marginTop: 1,
                            backgroundColor: "#334155",
                            borderRadius: "0 0 6px 6px",
                            borderLeft: "3px solid #475569",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 9,
                              lineHeight: 1.7,
                              color: "#94A3B8",
                              margin: 0,
                            }}
                          >
                            <strong style={{ color: "#CBD5E1" }}>
                              なぜ核心ではないか：
                            </strong>
                            {card.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 2,
                  padding: "1px 6px",
                  borderRadius: 3,
                  backgroundColor: "#EF444422",
                  color: "#EF4444",
                }}
              >
                ノイズ
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: result.distractorsPlaced === 0 ? "#22C55E" : "#EF4444",
                }}
              >
                {result.distractorsPlaced === 0 ? "✓" : `${result.distractorsPlaced}枚混入`}
              </span>
            </div>
            <p
              style={{
                fontSize: 9,
                lineHeight: 1.6,
                color: "#64748B",
                margin: "0 0 3px",
              }}
            >
              {phase1.explanation?.distractorNote}
            </p>
            {phase1.cards
              .filter((c) => c.type === "distractor")
              .map((card) => {
                const placed = !!result.cardReport[card.id];
                const ekey = `d-${card.id}`;
                const isOpen = expanded === ekey;
                return (
                  <div key={card.id} style={{ marginBottom: 3 }}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : ekey)}
                      style={{
                        padding: "7px 9px",
                        backgroundColor: "#1E293B",
                        borderRadius: 6,
                        borderLeft: `3px solid ${placed ? "#EF4444" : "#22C55E"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: placed ? "#EF4444" : "#22C55E",
                            marginRight: 4,
                            flexShrink: 0,
                          }}
                        >
                          {placed ? "✗" : "✓"}
                        </span>
                        <span style={{ fontSize: 9, lineHeight: 1.5, color: "#CBD5E1", flex: 1 }}>
                          {card.text}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            color: "#64748B",
                            marginLeft: 2,
                            flexShrink: 0,
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        >
                          ▼
                        </span>
                      </div>
                      {placed && (
                        <span
                          style={{
                            display: "block",
                            fontSize: 8,
                            color: "#EF4444",
                            marginTop: 2,
                            paddingLeft: 14,
                          }}
                        >
                          →「{TIER_LABELS[result.cardReport[card.id].placedTier]}」に配置
                        </span>
                      )}
                    </div>
                    {isOpen && card.reason && (
                      <div
                        style={{
                          padding: "7px 9px 7px 12px",
                          marginTop: 1,
                          backgroundColor: "#334155",
                          borderRadius: "0 0 6px 6px",
                          borderLeft: "3px solid #475569",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            lineHeight: 1.7,
                            color: "#94A3B8",
                            margin: 0,
                          }}
                        >
                          <strong style={{ color: "#CBD5E1" }}>なぜノイズか：</strong>
                          {card.reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button style={S.primaryButton} onClick={onNext}>
            次の問題
          </button>
          <button style={S.secondaryButton} onClick={onOpenStats}>
            📈
          </button>
          <button style={S.secondaryButton} onClick={onHome}>
            🏠
          </button>
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
