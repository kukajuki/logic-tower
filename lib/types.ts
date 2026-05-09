export type CardType = "conclusion" | "argument" | "evidence" | "distractor";

export type LevelNumber = 1 | 2 | 3;

export interface Card {
  id: string;
  text: string;
  type: CardType;
  tier: number;
  phrase: string;
  reason: string;
}

export interface IssueSelection {
  correctIssue: string;
  wrongIssues: { text: string; reason: string }[];
}

export interface SubIssueSelection {
  candidates: { text: string; isCorrect: boolean; reason: string }[];
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
  level: LevelNumber;
  title: string;
  situation: string;
  issue: string;
  issueSelection?: IssueSelection;
  subIssueSelection?: SubIssueSelection;
  phase1: Phase1Data;
}

export interface Phase1Score {
  score: number;
  accuracy: number;
  tierScores: [number, number, number];
  timeLeft: number;
}

export interface RoundScore {
  issueCorrect?: boolean;
  subIssueCorrect?: number;
  phase1: Phase1Score;
  total: number;
}

export interface HistoryEntry {
  date: string;
  time: string;
  questionId: string;
  questionTitle: string;
  level: LevelNumber;
  /** @deprecated v1 entries used isBasic; new entries should rely on `level`. */
  isBasic?: boolean;
  scores: RoundScore;
}

export type Slots = Record<string, string>;
