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
  evSwap: boolean;
}

/**
 * Mid-right evidence swap: the user placed the two correct cards into
 * t2-1 / t2-2 but with their positions exchanged. We treat this as both
 * slots being correct because the spec defines the middle slot as
 * "補強データ" and the right slot as "反証 or 内部データ" — both have the
 * same status as supporting evidence, so a left-right swap among them is
 * not a meaningful structural error (unlike t2-0, the most-important data,
 * which we still grade strictly).
 */
export function isMidRightEvidenceSwap(phase1: Phase1Data, slots: Slots): boolean {
  const correctMid = phase1.correctSlots["t2-1"];
  const correctRight = phase1.correctSlots["t2-2"];
  if (!correctMid || !correctRight) return false;
  return (
    slots["t2-1"] === correctRight &&
    slots["t2-2"] === correctMid
  );
}

export function isSlotPlacementCorrect(
  sid: string,
  cid: string | undefined,
  phase1: Phase1Data,
  slots: Slots,
): boolean {
  if (!cid) return false;
  if (phase1.correctSlots[sid] === cid) return true;
  if ((sid === "t2-1" || sid === "t2-2") && isMidRightEvidenceSwap(phase1, slots)) {
    return true;
  }
  return false;
}

export function scorePhase1(phase1: Phase1Data, slots: Slots, timeLeft: number): Phase1Result {
  let correct = 0;
  const tierScores: [number, number, number] = [0, 0, 0];

  for (let t = 0; t < 3; t++) {
    for (let i = 0; i < TIER_SLOTS[t]; i++) {
      const sid = `t${t}-${i}`;
      if (isSlotPlacementCorrect(sid, slots[sid], phase1, slots)) {
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
      correct: isSlotPlacementCorrect(sid, cid, phase1, slots),
      isDistractor: phase1.cards.find((c) => c.id === cid)?.type === "distractor",
    };
  }

  const argSwap =
    !!slots["t1-0"] &&
    !!slots["t1-1"] &&
    slots["t1-0"] === phase1.correctSlots["t1-1"] &&
    slots["t1-1"] === phase1.correctSlots["t1-0"];

  const evSwap = isMidRightEvidenceSwap(phase1, slots);

  return {
    score,
    accuracy: correct,
    tierScores,
    distractorsPlaced,
    timeBonus,
    timeLeft,
    cardReport,
    argSwap,
    evSwap,
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
