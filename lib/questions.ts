import { LevelNumber, Question } from "./types";
import { LV1_QUESTIONS } from "./questions-lv1";
import { LV2_QUESTIONS } from "./questions-lv2";
import { LV3_QUESTIONS } from "./questions-lv3";

export type Level = LevelNumber;

export const LEVELS: Level[] = [1, 2, 3];

export interface LevelInfo {
  level: Level;
  label: string;
  shortName: string;
  description: string;
  expectedSize: number;
  emoji: string;
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
  1: {
    level: 1,
    label: "Lv.1",
    shortName: "型を覚える",
    description: "イシュー提示済み。9枚のカードを6スロットに配置する基本練習。",
    expectedSize: 5,
    emoji: "📚",
  },
  2: {
    level: 2,
    label: "Lv.2",
    shortName: "問いを選ぶ",
    description: "イシュー候補4つから正解を選び、その上でカードを配置。",
    expectedSize: 20,
    emoji: "🏋️",
  },
  3: {
    level: 3,
    label: "Lv.3",
    shortName: "問いを分解する",
    description: "イシュー → サブイシュー2つを選び、結論と根拠を組み立てる実戦。",
    expectedSize: 70,
    emoji: "🔥",
  },
};

export const QUESTION_BANK: Record<Level, Question[]> = {
  1: LV1_QUESTIONS,
  2: LV2_QUESTIONS,
  3: LV3_QUESTIONS,
};

export function getQuestionsByLevel(level: Level): Question[] {
  return QUESTION_BANK[level] ?? [];
}

export function isLevelReady(level: Level): boolean {
  return getQuestionsByLevel(level).length > 0;
}
