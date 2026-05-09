/**
 * LOGIC TOWER — Lv.2 / Lv.3 batch generator (Phase 1 data).
 *
 * Implements spec §8 for the v3 (9-card) shape: 1 conclusion + 3 arguments +
 * 3 evidences + 2 distractors, with an IssueSelection per question and a
 * SubIssueSelection on Lv.3.
 *
 * Usage (from project root):
 *   npm run gen:lv2     # 20 Lv.2 questions → lib/questions-lv2.ts
 *   npm run gen:lv3     # 70 Lv.3 questions → lib/questions-lv3.ts
 *   npm run gen:all     # both
 *
 *   # override model:
 *   npm run gen:lv2 -- --model claude-opus-4-7
 *
 * Reads ANTHROPIC_API_KEY from .env.local / .env / the ambient env.
 *
 * Per-question progress is checkpointed to scripts/output/lv{N}-progress.json
 * after every successful generation, so an interrupted run resumes cleanly.
 *
 * Reliability levers:
 * - Structured Outputs (output_config.format) enforce the JSON Schema shape.
 * - Prompt caching on the (large) system prompt keeps the second-onward
 *   request inexpensive.
 * - Streaming with max_tokens=16000 stays clear of HTTP timeouts.
 * - Adaptive thinking + effort=medium balances quality and cost.
 *
 * Phase 2 / Phase 3 generation is intentionally out of scope here — those
 * stages will be appended when v2 / v3 ship.
 */

import Anthropic from "@anthropic-ai/sdk";
import { config as loadDotenv } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  Card,
  IssueSelection,
  Phase1Data,
  Question,
  SubIssueSelection,
} from "../lib/types";

loadDotenv({ path: ".env.local" });
loadDotenv();

// ─── Config ────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 3;

type LevelGen = 2 | 3;
const LEVEL_SIZES: Record<LevelGen, number> = { 2: 20, 3: 70 };

const INDUSTRIES = [
  "フィンテックスタートアップ",
  "地方自治体",
  "大手小売チェーン",
  "医療法人",
  "物流会社",
  "EdTech企業",
  "不動産デベロッパー",
  "食品メーカー",
  "人材紹介会社",
  "保険会社",
  "アパレルブランド",
  "旅行代理店",
  "コンサルティングファーム",
  "自動車部品メーカー",
  "建設会社",
  "EC事業者",
  "出版社",
  "広告代理店",
  "農業法人",
  "介護事業者",
];

// Lv.2: 比較的具体的・運用寄りの意思決定（応用）
const LV2_THEMES = [
  "新規事業の撤退判断",
  "AIツール導入の優先順位",
  "サブスクモデルへの転換",
  "新オフィスへの移転判断",
  "料金体系の刷新",
  "顧客セグメントの絞り込み",
  "内製化vs外注の判断",
  "人材育成投資の配分",
  "サプライチェーンの見直し",
  "ブランドリポジショニング",
];

// Lv.3: より戦略的・高難度な意思決定（実戦）
const LV3_THEMES = [
  "海外進出の是非",
  "M&Aの実行判断",
  "事業ポートフォリオの再編",
  "組織再編の方針",
  "パートナーシップ戦略",
  "ESG対応の優先度",
  "新技術への投資判断",
  "ガバナンス体制の刷新",
  "上場準備の判断",
  "事業承継の進め方",
];

// ─── Prompts ───────────────────────────────────────────────────────────────

const COMMON_RULES = `あなたはMBA教授です。安宅和人『イシューからはじめよ』の方法論に基づき、ビジネスの構造化思考トレーニング用の問題を1問生成してください。

## イシュー設計の原則
- 「構造化せよ」「整理せよ」のような作業指示は絶対に使わない
- イシューは「答えを出す価値のある問い」であり、意思決定に直結する1つの問いにする
- 「〇〇すべきか？」のようにシンプルな1文。条件や補足の問いは付けない
- situationで背景事実を、issueで答えるべき問いを明確に分離する

## カード設計（9枚構成・厳守）
- 結論1枚（c1）+ 論点3枚（c3, c5, c7）+ 根拠3枚（c2, c4, c6）+ ノイズ2枚（d1, d2）
- 全カードに phrase（15字以内の要約）と reason（なぜこの位置か / なぜ核心ではないか）を付ける
- 結論は「〇〇すべき。ただし△△が条件」の形式
- 根拠には必ず具体的な数字を含める

## 論点カード（必ず "〇〇か？" の問い形式）
- c5（左）= 推進理由 / 価値 / Why / 緊急性のサブイシュー
- c3（右）= 制約条件 / 実現性 / How / 対策のサブイシュー
- c7（3枚目）= 関連はあるが、このイシューの核心ではないサブイシュー
  - 例：実行段階の運用課題、移行決定後の実装課題、横断的に並行検討する論点
  - reason には「なぜ核心ではないか」を明記
- 論点 phrase も問い形式（例：「成長余地はあるか？」）

## 根拠カード
- c2（左）= 最重要データ
- c4（中）= 補強データ
- c6（右）= 反証 or 内部データ

## ノイズカード（distractor）
- 一見関連あるが、意思決定に直接影響しない情報
- マクロ背景・規制動向・トレンド一般・建築様式など、So What? が出ない事実

## ピラミッド全体の原則
- 「問い→答え」の連鎖：イシュー（問い）→ 結論（答え）→ 論点（サブ問い）→ 根拠（サブ答え）

## カードIDとスロット規約（厳守）
- cards のIDは厳密に c1, c2, c3, c4, c5, c6, c7, d1, d2 を使う
- tier 値: c1=0, c3/c5/c7=1, c2/c4/c6=2, d1/d2=-1
- correctSlots は次を必ず満たす:
    t0-0=c1, t1-0=c5, t1-1=c3, t2-0=c2, t2-1=c4, t2-2=c6
- c7, d1, d2 は correctSlots に含めない

## 出力
JSONオブジェクトのみ。マークダウン、コードフェンス、前置きや説明は一切出力しない。`;

const LV2_RULES = `${COMMON_RULES}

## レベル: Lv.2（問いを選ぶ）
プレイヤーは状況提示を読んだあと、4つのイシュー候補から正解を選ぶ。その後カード配置に進む。

## issueSelection の設計
- correctIssue: issue と完全一致させる（同じ文）
- wrongIssues: 不正解3つ。次の3パターンから1つずつ書き分ける（順不同）
  1. 自社でコントロールできない問い（マクロ環境・他社動向・市場の趨勢に依存）
  2. スコープが広すぎる問い（業界全体・社会全体に及ぶ）
  3. 論点のすり替え（本来の課題から逸れた、近接する別のイシュー）
- 各 wrongIssue.reason に「なぜこの問いに答えても今の意思決定に直結しないか」を簡潔に書く（40-60字）`;

const LV3_RULES = `${COMMON_RULES}

## レベル: Lv.3（問いを分解する）
プレイヤーは状況提示 → イシュー4択 → サブイシュー5択から2つ選択 → 結論+根拠を配置、という流れで進む。

## issueSelection の設計（Lv.2と同じ）
- correctIssue: issue と完全一致
- wrongIssues: 3つ。次のパターンを各1つずつ
  1. 自社でコントロールできない問い
  2. スコープが広すぎる問い
  3. 論点のすり替え
- 各 wrongIssue.reason に40-60字の解説

## subIssueSelection の設計
- candidates: 5つ。**isCorrect=true は2つだけ**
- isCorrect=true の2つは cards 内の c5, c3 のテキストと完全一致させる（同じ文をそのまま使う）
- isCorrect=false の3つは次のパターンから書き分ける（順不同）
  1. cards 内の c7 と同じ「関連はあるが核心ではない」問い（c7.text と完全一致でよい）
  2. 枝葉の問い（実行レベルの詳細に踏み込みすぎ・運用粒度の問い）
  3. 自社で答えられない問い（外部環境・他社・将来予測に依存）
- 各 candidate.reason に「なぜ正解 / 不正解か」を40-60字で書く`;

// ─── JSON Schema ───────────────────────────────────────────────────────────

const CARD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    text: { type: "string" },
    type: {
      type: "string",
      enum: ["conclusion", "argument", "evidence", "distractor"],
    },
    tier: { type: "integer" },
    phrase: { type: "string" },
    reason: { type: "string" },
  },
  required: ["id", "text", "type", "tier", "phrase", "reason"],
} as const;

const ISSUE_SELECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    correctIssue: { type: "string" },
    wrongIssues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          reason: { type: "string" },
        },
        required: ["text", "reason"],
      },
    },
  },
  required: ["correctIssue", "wrongIssues"],
} as const;

const SUB_ISSUE_SELECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          isCorrect: { type: "boolean" },
          reason: { type: "string" },
        },
        required: ["text", "isCorrect", "reason"],
      },
    },
  },
  required: ["candidates"],
} as const;

const COMMON_QUESTION_PROPS = {
  title: { type: "string" },
  situation: { type: "string" },
  issue: { type: "string" },
  issueSelection: ISSUE_SELECTION_SCHEMA,
  explanation: {
    type: "object",
    additionalProperties: false,
    properties: {
      overview: { type: "string" },
      tiers: { type: "array", items: { type: "string" } },
      distractorNote: { type: "string" },
    },
    required: ["overview", "tiers", "distractorNote"],
  },
  narrative: {
    type: "object",
    additionalProperties: false,
    properties: {
      correctReading: { type: "string" },
      argSwap: {
        type: "object",
        additionalProperties: false,
        properties: {
          reading: { type: "string" },
          contrast: { type: "string" },
        },
        required: ["reading", "contrast"],
      },
    },
    required: ["correctReading", "argSwap"],
  },
  cards: { type: "array", items: CARD_SCHEMA },
  correctSlots: {
    type: "object",
    additionalProperties: false,
    properties: {
      "t0-0": { type: "string" },
      "t1-0": { type: "string" },
      "t1-1": { type: "string" },
      "t2-0": { type: "string" },
      "t2-1": { type: "string" },
      "t2-2": { type: "string" },
    },
    required: ["t0-0", "t1-0", "t1-1", "t2-0", "t2-1", "t2-2"],
  },
} as const;

const LV2_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: COMMON_QUESTION_PROPS,
  required: [
    "title",
    "situation",
    "issue",
    "issueSelection",
    "explanation",
    "narrative",
    "cards",
    "correctSlots",
  ],
} as const;

const LV3_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...COMMON_QUESTION_PROPS,
    subIssueSelection: SUB_ISSUE_SELECTION_SCHEMA,
  },
  required: [
    "title",
    "situation",
    "issue",
    "issueSelection",
    "subIssueSelection",
    "explanation",
    "narrative",
    "cards",
    "correctSlots",
  ],
} as const;

// ─── Combination plan ──────────────────────────────────────────────────────

interface Combo {
  industry: string;
  theme: string;
}

function planCombinations(level: LevelGen): Combo[] {
  const themes = level === 2 ? LV2_THEMES : LV3_THEMES;
  const size = LEVEL_SIZES[level];
  const out: Combo[] = [];
  for (let i = 0; i < size; i++) {
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    const theme = themes[Math.floor(i / INDUSTRIES.length) % themes.length];
    out.push({ industry, theme });
  }
  return out;
}

function questionId(level: LevelGen, index: number): string {
  return `lv${level}-${String(index + 1).padStart(3, "0")}`;
}

// ─── Validation ────────────────────────────────────────────────────────────

interface RawQuestion {
  title: string;
  situation: string;
  issue: string;
  issueSelection: IssueSelection;
  subIssueSelection?: SubIssueSelection;
  explanation: { overview: string; tiers: string[]; distractorNote: string };
  narrative: {
    correctReading: string;
    argSwap: { reading: string; contrast: string };
  };
  cards: Card[];
  correctSlots: Record<string, string>;
}

const REQUIRED_CARD_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "d1", "d2"];
const EXPECTED_TIERS: Record<string, number> = {
  c1: 0,
  c2: 2,
  c3: 1,
  c4: 2,
  c5: 1,
  c6: 2,
  c7: 1,
  d1: -1,
  d2: -1,
};
const EXPECTED_TYPES: Record<string, Card["type"]> = {
  c1: "conclusion",
  c2: "evidence",
  c3: "argument",
  c4: "evidence",
  c5: "argument",
  c6: "evidence",
  c7: "argument",
  d1: "distractor",
  d2: "distractor",
};
const EXPECTED_SLOTS: Record<string, string> = {
  "t0-0": "c1",
  "t1-0": "c5",
  "t1-1": "c3",
  "t2-0": "c2",
  "t2-1": "c4",
  "t2-2": "c6",
};

function validateRaw(level: LevelGen, data: unknown): asserts data is RawQuestion {
  if (!data || typeof data !== "object") throw new Error("not an object");
  const d = data as Record<string, unknown>;

  // cards
  if (!Array.isArray(d.cards) || d.cards.length !== 9) {
    throw new Error(
      `cards must have exactly 9 entries, got ${
        Array.isArray(d.cards) ? d.cards.length : "none"
      }`,
    );
  }
  const byId = new Map<string, Card>();
  for (const card of d.cards as Card[]) {
    if (typeof card.id !== "string") throw new Error("card.id missing");
    if (byId.has(card.id)) throw new Error(`duplicate card id: ${card.id}`);
    byId.set(card.id, card);
  }
  for (const requiredId of REQUIRED_CARD_IDS) {
    const card = byId.get(requiredId);
    if (!card) throw new Error(`missing card id: ${requiredId}`);
    if (card.type !== EXPECTED_TYPES[requiredId]) {
      throw new Error(
        `card ${requiredId} should be type=${EXPECTED_TYPES[requiredId]}, got ${card.type}`,
      );
    }
    if (card.tier !== EXPECTED_TIERS[requiredId]) {
      throw new Error(
        `card ${requiredId} should be tier=${EXPECTED_TIERS[requiredId]}, got ${card.tier}`,
      );
    }
  }

  // correctSlots
  const slots = d.correctSlots as Record<string, string> | undefined;
  if (!slots) throw new Error("correctSlots missing");
  for (const [sid, expectedCid] of Object.entries(EXPECTED_SLOTS)) {
    if (slots[sid] !== expectedCid) {
      throw new Error(
        `correctSlots[${sid}] should be ${expectedCid}, got ${slots[sid]}`,
      );
    }
  }

  // explanation.tiers
  const explanation = d.explanation as { tiers?: unknown } | undefined;
  if (
    !explanation ||
    !Array.isArray(explanation.tiers) ||
    explanation.tiers.length !== 3
  ) {
    throw new Error("explanation.tiers must be a 3-element array");
  }

  // issueSelection
  const issueSel = d.issueSelection as IssueSelection | undefined;
  if (!issueSel) throw new Error("issueSelection missing");
  if (issueSel.correctIssue !== d.issue) {
    throw new Error(
      `issueSelection.correctIssue must equal issue (got "${issueSel.correctIssue}" vs "${d.issue}")`,
    );
  }
  if (!Array.isArray(issueSel.wrongIssues) || issueSel.wrongIssues.length !== 3) {
    throw new Error(
      `issueSelection.wrongIssues must have exactly 3 entries, got ${
        Array.isArray(issueSel.wrongIssues) ? issueSel.wrongIssues.length : "none"
      }`,
    );
  }

  // Lv.3-only: subIssueSelection
  if (level === 3) {
    const subSel = d.subIssueSelection as SubIssueSelection | undefined;
    if (!subSel) throw new Error("subIssueSelection missing (required for Lv.3)");
    if (!Array.isArray(subSel.candidates) || subSel.candidates.length !== 5) {
      throw new Error(
        `subIssueSelection.candidates must have exactly 5 entries, got ${
          Array.isArray(subSel.candidates) ? subSel.candidates.length : "none"
        }`,
      );
    }
    const correctCount = subSel.candidates.filter((c) => c.isCorrect).length;
    if (correctCount !== 2) {
      throw new Error(
        `subIssueSelection must contain exactly 2 isCorrect=true candidates, got ${correctCount}`,
      );
    }
    const correctTexts = subSel.candidates
      .filter((c) => c.isCorrect)
      .map((c) => c.text);
    const c5Text = byId.get("c5")!.text;
    const c3Text = byId.get("c3")!.text;
    const expected = new Set([c5Text, c3Text]);
    for (const t of correctTexts) {
      if (!expected.has(t)) {
        throw new Error(
          `subIssueSelection's correct candidates must match c5/c3 text exactly. Got "${t}", expected one of ["${c5Text}", "${c3Text}"]`,
        );
      }
    }
  }
}

function toQuestion(level: LevelGen, id: string, raw: RawQuestion): Question {
  const phase1: Phase1Data = {
    cards: raw.cards,
    correctSlots: raw.correctSlots,
    explanation: {
      overview: raw.explanation.overview,
      tiers: [
        raw.explanation.tiers[0] ?? "",
        raw.explanation.tiers[1] ?? "",
        raw.explanation.tiers[2] ?? "",
      ],
      distractorNote: raw.explanation.distractorNote,
    },
    narrative: raw.narrative,
  };
  const out: Question = {
    id,
    level,
    title: raw.title,
    situation: raw.situation,
    issue: raw.issue,
    issueSelection: raw.issueSelection,
    phase1,
  };
  if (level === 3 && raw.subIssueSelection) {
    out.subIssueSelection = raw.subIssueSelection;
  }
  return out;
}

// ─── API call ──────────────────────────────────────────────────────────────

async function generateOne(
  client: Anthropic,
  model: string,
  level: LevelGen,
  id: string,
  industry: string,
  theme: string,
): Promise<Question> {
  const systemPrompt = level === 2 ? LV2_RULES : LV3_RULES;
  const schema = level === 2 ? LV2_SCHEMA : LV3_SCHEMA;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = client.messages.stream({
        model,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        // output_config is the structured-outputs API; cast through unknown
        // because this SDK version may not yet have a typed declaration for it.
        ...({
          output_config: {
            effort: "medium",
            format: { type: "json_schema", schema },
          },
        } as unknown as Record<string, never>),
        messages: [
          {
            role: "user",
            content:
              `業界：${industry}\n` +
              `テーマ：${theme}\n` +
              `問題ID：${id}\n` +
              `Level：Lv.${level}\n` +
              `この組み合わせで構造化思考トレーニング用の問題を1問生成してください。JSONオブジェクトのみを出力。`,
          },
        ],
      });
      const message = await stream.finalMessage();
      const text = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (!text) throw new Error("empty text response");
      const data = JSON.parse(text);
      validateRaw(level, data);
      return toQuestion(level, id, data);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

// ─── Progress / output files ───────────────────────────────────────────────

const ROOT = process.cwd();
const OUTPUT_DIR = resolve(ROOT, "scripts/output");

function progressPath(level: LevelGen) {
  return resolve(OUTPUT_DIR, `lv${level}-progress.json`);
}

function libPath(level: LevelGen) {
  return resolve(ROOT, `lib/questions-lv${level}.ts`);
}

interface Progress {
  level: LevelGen;
  questions: Record<string, Question>;
}

function loadProgress(level: LevelGen): Progress {
  const path = progressPath(level);
  if (!existsSync(path)) return { level, questions: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as Progress;
    return { level, questions: parsed.questions ?? {} };
  } catch {
    return { level, questions: {} };
  }
}

function saveProgress(progress: Progress) {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(progressPath(progress.level), JSON.stringify(progress, null, 2));
}

function writeLibFile(level: LevelGen, ordered: Question[]) {
  const banner =
    `// AUTO-GENERATED by scripts/generate-questions.ts.\n` +
    `// Do not edit by hand. Re-run with \`npm run gen:lv${level}\` to regenerate.\n\n`;
  const body =
    `import { Question } from "./types";\n\n` +
    `export const LV${level}_QUESTIONS: Question[] = ${JSON.stringify(
      ordered,
      null,
      2,
    )};\n`;
  writeFileSync(libPath(level), banner + body);
}

// ─── Main ──────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { target: string; model: string } {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const target = positional[0] ?? "";
  const modelIdx = argv.indexOf("--model");
  const model = modelIdx >= 0 ? argv[modelIdx + 1] : DEFAULT_MODEL;
  return { target, model };
}

function targetToLevels(target: string): LevelGen[] {
  if (target === "all") return [2, 3];
  if (target === "lv2") return [2];
  if (target === "lv3") return [3];
  return [];
}

async function main() {
  const argv = process.argv.slice(2);
  const { target, model } = parseArgs(argv);
  const levels = targetToLevels(target);
  if (levels.length === 0) {
    console.error("usage: tsx scripts/generate-questions.ts <lv2|lv3|all> [--model <id>]");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
    process.exit(1);
  }

  const client = new Anthropic();

  for (const level of levels) {
    const combos = planCombinations(level);
    const progress = loadProgress(level);
    const remaining = combos.filter(
      (_, i) => !progress.questions[questionId(level, i)],
    );
    console.log(
      `\n=== Lv.${level}: ${remaining.length}/${combos.length} questions to generate (model: ${model}) ===`,
    );

    for (let i = 0; i < combos.length; i++) {
      const id = questionId(level, i);
      if (progress.questions[id]) {
        console.log(`[${i + 1}/${combos.length}] ${id}: cached ✓`);
        continue;
      }
      const { industry, theme } = combos[i];
      process.stdout.write(
        `[${i + 1}/${combos.length}] ${id}: ${industry} × ${theme} ... `,
      );
      const start = Date.now();
      try {
        const question = await generateOne(client, model, level, id, industry, theme);
        progress.questions[id] = question;
        saveProgress(progress);
        console.log(`done (${Math.round((Date.now() - start) / 1000)}s)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`FAILED: ${msg}`);
        console.error(`Stopping. Re-run the same command to resume.`);
        process.exit(2);
      }
    }

    const ordered = combos.map(
      (_, i) => progress.questions[questionId(level, i)],
    );
    writeLibFile(level, ordered);
    console.log(`Wrote ${libPath(level)} with ${ordered.length} questions.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
