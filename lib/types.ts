export type CardType = "conclusion" | "argument" | "evidence" | "distractor";

export interface Card {
  id: string;
  text: string;
  type: CardType;
  tier: number;
  phrase: string;
  reason: string;
}

export interface Phase1Data {
  cards: Card[];
  correctSlots: Record<string, string>;
  explanation: {
    overview: string;
    tiers: [string, string, string];
    distractorNote: string;
  };
  narrative: {
    correctReading: string;
    argSwap: { reading: string; contrast: string };
  };
}

export interface Question {
  id: string;
  title: string;
  situation: string;
  issue: string;
  phase1: Phase1Data;
}

export interface Phase1Score {
  score: number;
  accuracy: number;
  tierScores: [number, number, number];
  timeLeft: number;
}

export interface RoundScore {
  phase1: Phase1Score;
  total: number;
}

export interface HistoryEntry {
  date: string;
  time: string;
  questionId: string;
  questionTitle: string;
  isBasic: boolean;
  scores: RoundScore;
}

export type Slots = Record<string, string>;
