import { Phase1Data, Slots } from "./types";
import { PHASE1_TIME, TIER_SLOTS } from "./constants";

export interface CardReportEntry {
  placedSlot: string;
  placedTier: number;
  correct: boolean;
  isDistractor: boolean;
}

export interface Phase1Result {
  score: number;
  accuracy: number;
  tierScores: [number, number, number];
  distractorsPlaced: number;
  timeBonus: number;
  timeLeft: number;
  cardReport: Record<string, CardReportEntry>;
  argSwap: boolean;
}

export function scorePhase1(phase1: Phase1Data, slots: Slots, timeLeft: number): Phase1Result {
  let correct = 0;
  const tierScores: [number, number, number] = [0, 0, 0];

  for (let t = 0; t < 3; t++) {
    for (let i = 0; i < TIER_SLOTS[t]; i++) {
      const sid = `t${t}-${i}`;
      if (slots[sid] && slots[sid] === phase1.correctSlots[sid]) {
        tierScores[t]++;
        correct++;
      }
    }
  }

  const distractorsPlaced = Object.values(slots).filter(
    (cid) => phase1.cards.find((c) => c.id === cid)?.type === "distractor"
  ).length;

  const timeBonus = Math.round((timeLeft / PHASE1_TIME) * 20);
  const score = Math.max(
    0,
    Math.min(100, Math.round(((correct - distractorsPlaced) / 6) * 80) + timeBonus)
  );

  const cardReport: Record<string, CardReportEntry> = {};
  for (const [sid, cid] of Object.entries(slots)) {
    const tier = parseInt(sid[1], 10);
    cardReport[cid] = {
      placedSlot: sid,
      placedTier: tier,
      correct: phase1.correctSlots[sid] === cid,
      isDistractor: phase1.cards.find((c) => c.id === cid)?.type === "distractor",
    };
  }

  const argSwap =
    !!slots["t1-0"] &&
    !!slots["t1-1"] &&
    slots["t1-0"] === phase1.correctSlots["t1-1"] &&
    slots["t1-1"] === phase1.correctSlots["t1-0"];

  return {
    score,
    accuracy: correct,
    tierScores,
    distractorsPlaced,
    timeBonus,
    timeLeft,
    cardReport,
    argSwap,
  };
}

export interface Rank {
  label: "S" | "A" | "B" | "C";
  color: string;
}

export function rankFor(score: number): Rank {
  if (score >= 90) return { label: "S", color: "#F59E0B" };
  if (score >= 70) return { label: "A", color: "#3B82F6" };
  if (score >= 50) return { label: "B", color: "#8B5CF6" };
  return { label: "C", color: "#EF4444" };
}
