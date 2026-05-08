import { Question } from "./types";
import { LEVEL1_QUESTIONS } from "./questions-level1";
import { LEVEL2_QUESTIONS } from "./questions-level2";
import { LEVEL3_QUESTIONS } from "./questions-level3";

export type Level = 1 | 2 | 3;

export const LEVELS: Level[] = [1, 2, 3];

export interface LevelInfo {
  level: Level;
  label: string;
  description: string;
  expectedSize: number;
  emoji: string;
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
  1: {
    level: 1,
    label: "Lv.1",
    description: "厳選された基礎5問で「型」を覚える",
    expectedSize: 5,
    emoji: "📚",
  },
  2: {
    level: 2,
    label: "Lv.2",
    description: "応用20問で論点設計の幅を広げる",
    expectedSize: 20,
    emoji: "🏋️",
  },
  3: {
    level: 3,
    label: "Lv.3",
    description: "実戦70問で構造化思考を鍛え抜く",
    expectedSize: 70,
    emoji: "🔥",
  },
};

export const QUESTION_BANK: Record<Level, Question[]> = {
  1: LEVEL1_QUESTIONS,
  2: LEVEL2_QUESTIONS,
  3: LEVEL3_QUESTIONS,
};

export function getQuestionsByLevel(level: Level): Question[] {
  return QUESTION_BANK[level] ?? [];
}

export function isLevelReady(level: Level): boolean {
  return getQuestionsByLevel(level).length > 0;
}
