"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HistoryEntry } from "@/lib/types";
import { TIER_COLORS, TIER_LABELS, TIER_SLOTS } from "@/lib/constants";
import { S } from "@/lib/styles";

interface StatsScreenProps {
  history: HistoryEntry[];
  onBack: () => void;
}

export default function StatsScreen({ history, onBack }: StatsScreenProps) {
  const chartData = history.map((h, i) => ({ n: `#${i + 1}`, s: h.scores.phase1.score }));
  const avg = history.length
    ? Math.round(history.reduce((a, h) => a + h.scores.phase1.score, 0) / history.length)
    : 0;
  const best = history.length ? Math.max(...history.map((h) => h.scores.phase1.score)) : 0;
  const recent5 = history.slice(-5);
  const recentAvg = recent5.length
    ? Math.round(recent5.reduce((a, h) => a + h.scores.phase1.score, 0) / recent5.length)
    : 0;
  const early5 = history.slice(0, Math.min(5, history.length));
  const earlyAvg = early5.length
    ? Math.round(early5.reduce((a, h) => a + h.scores.phase1.score, 0) / early5.length)
    : 0;
  const trend = history.length >= 4 ? recentAvg - earlyAvg : 0;
  const tierAvg = [0, 1, 2].map((t) => {
    const values = history.map((h) => h.scores.phase1.tierScores[t]);
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "0";
  });

  const totalPlays = history.length;

  return (
    <div style={S.container}>
      <div style={{ padding: "20px 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
            📈 成長グラフ
          </h2>
          <button onClick={onBack} style={S.backButton}>
            戻る
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {[
            { label: "平均", value: avg, color: "#F59E0B" },
            { label: "ベスト", value: best, color: "#22C55E" },
            {
              label: "トレンド",
              value: `${trend >= 0 ? "+" : ""}${trend}`,
              color: trend >= 0 ? "#22C55E" : "#EF4444",
            },
          ].map((m, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#1E293B",
                borderRadius: 8,
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 9, color: "#64748B", margin: 0 }}>{m.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: "12px 4px 4px" }}>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="n" tick={{ fontSize: 8, fill: "#64748B" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="s"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#sg)"
                dot={{ r: 2, fill: "#F59E0B" }}
                name="スコア"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: 12, marginTop: 8 }}>
          {[0, 1, 2].map((t) => (
            <div key={t} style={{ marginBottom: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 10, color: TIER_COLORS[t], fontWeight: 700 }}>
                  {TIER_LABELS[t]}
                </span>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>
                  {tierAvg[t]}/{TIER_SLOTS[t]}
                </span>
              </div>
              <div style={{ height: 4, backgroundColor: "#0F172A", borderRadius: 2 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(parseFloat(tierAvg[t]) / TIER_SLOTS[t]) * 100}%`,
                    backgroundColor: TIER_COLORS[t],
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: 12, marginTop: 8 }}>
          {history
            .slice(-10)
            .reverse()
            .map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 0",
                  borderBottom: "1px solid #334155",
                }}
              >
                <div>
                  <span style={{ fontSize: 10, color: "#CBD5E1" }}>
                    <span style={{ color: "#64748B", marginRight: 4 }}>
                      {`Lv.${h.level ?? 1}`}
                    </span>
                    {h.questionTitle}
                  </span>
                  <span style={{ fontSize: 8, color: "#475569", marginLeft: 4 }}>{h.date}</span>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color:
                      h.scores.phase1.score >= 90
                        ? "#F59E0B"
                        : h.scores.phase1.score >= 70
                        ? "#3B82F6"
                        : h.scores.phase1.score >= 50
                        ? "#8B5CF6"
                        : "#EF4444",
                  }}
                >
                  {h.scores.phase1.score}
                </span>
              </div>
            ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button style={S.primaryButton} onClick={onBack}>
            戻る
          </button>
        </div>

        <p style={{ fontSize: 10, color: "#475569", textAlign: "center", marginTop: 14 }}>
          累計{totalPlays}回
        </p>
      </div>
    </div>
  );
}
