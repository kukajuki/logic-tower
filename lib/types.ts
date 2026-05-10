export type CardType = "conclusion" | "argument" | "evidence" | "distractor";

export type LevelNumber = 1 | 2 | 3;

/**
 * Argument-pattern key. Each Phase 1 question is classified into one of 12
 * canonical sub-issue patterns (see lib/argument-patterns.ts) so the c5
 * (left) / c3 (right) framing matches the issue type. The c7 third
 * argument is always "related but not core" regardless of pattern.
 */
export type ArgumentPattern =
  | "新規参入・拡大型"
  | "危機対応型"
  | "投資判断型"
  | "制度変更型"
  | "優先順位型"
  | "チャネル転換型"
  | "組織変革型"
  | "テクノロジー導入型"
  | "撤退・縮小型"
  | "アライアンス型"
  | "価格変更型"
  | "市場開拓型";

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
  /** Canonical sub-issue pattern this question follows. */
  pattern?: ArgumentPattern;
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
