# LOGIC TOWER — Claude Code 実装指示書

## 0. この指示書の使い方

この指示書は **3段階に分けてリリース** する設計です。各バージョンの指示セクションだけを読んで順に実装してください。

| バージョン | 対象セクション | 所要時間目安 |
|---|---|---|
| v1（Phase 1のみ） | セクション 1〜7 | 1-2時間 |
| v2（+Phase 2） | セクション 8〜9 | 1-2時間 |
| v3（+Phase 3） | セクション 10〜12 | 1-2時間 |

**v1だけで完全に動くアプリとしてデプロイ可能** です。v2・v3は後日追加する想定。

---

## 1. プロジェクト概要

「LOGIC TOWER」は、ビジネスの構造化思考を鍛えるスマホ向けWebアプリ（PWA）。1ラウンド約5分・3フェーズ構成で、毎日の隙間時間にプレイする設計。

### ターゲットユーザー
「複数要素を含む問いに対して、論点を整理・優先順位付けして構造的に回答する力」を鍛えたいビジネスパーソン。

### 3フェーズの構成

| Phase | 名前 | 時間 | 鍛える力 | 実装バージョン |
|---|---|---|---|---|
| 1 | 論点タワー | 90秒 | 構造を組む力（MECE度） | v1 |
| 2 | 60秒バトル | 60秒 | 構造を守る力（骨格安定度） | v2 |
| 3 | 前提クラッシュ | 90秒 | 構造を組み替える力（適応速度） | v3 |

### 設計上の重要原則

**ランタイムのAPI呼び出しはゼロ。** 全105問（基礎5問＋実践100問）の問題データ（Phase 1〜3のデータ含む）を事前にバッチ生成し、アプリにJSONとして同梱する。これにより：
- APIキー管理が不要
- ローディング待ちなし
- オフラインでもプレイ可能（PWA）
- ランタイムコストゼロ

### 技術スタック
- Next.js (App Router)、静的エクスポート（`output: 'export'`）
- React + Tailwind CSS
- recharts（グラフ・レーダーチャート）
- localStorage（スコア履歴の永続化）
- PWA（manifest.json + Service Worker）
- デプロイ先：Vercel

---

## 2. ディレクトリ構成

```
logic-tower/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # メイン（ゲーム全体をstate管理）
│   └── globals.css
├── components/
│   ├── StartScreen.tsx          # スタート画面（モード選択）
│   ├── PlayPhase1.tsx           # Phase 1: 論点タワー
│   ├── PlayPhase2.tsx           # Phase 2: 60秒バトル [v2]
│   ├── PlayPhase3.tsx           # Phase 3: 前提クラッシュ [v3]
│   ├── ResultPhase1.tsx         # Phase 1 結果画面 [v1]
│   ├── ResultIntegrated.tsx     # 3Phase統合結果画面 [v3]
│   ├── StatsScreen.tsx          # 成長グラフ
│   ├── Timer.tsx                # 共通タイマー
│   └── PyramidView.tsx          # 共通ピラミッド表示（読み取り専用版あり）
├── lib/
│   ├── types.ts                 # 型定義
│   ├── questions-basic.ts       # 基礎5問
│   ├── questions-practice.ts    # 実践100問（バッチ生成）
│   ├── scoring.ts               # 採点ロジック
│   ├── narrative.ts             # ナラティブフィードバック生成
│   └── storage.ts               # localStorage管理
├── scripts/
│   └── generate-questions.ts    # 100問バッチ生成スクリプト（1回だけ実行）
├── public/
│   ├── manifest.json
│   ├── sw.js                    # Service Worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── .env.local                   # ANTHROPIC_API_KEY（バッチ生成時のみ使用）
├── next.config.js
└── package.json
```

---

## 3. 型定義（`lib/types.ts`）

```typescript
// ─── カード ───
interface Card {
  id: string;              // "c1"〜"c6", "d1", "d2", "n1"〜"n3"
  text: string;            // 本文（40-60字）
  type: "conclusion" | "argument" | "evidence" | "distractor";
  tier: number;            // 0=結論, 1=論点, 2=根拠, -1=ノイズ
  phrase: string;          // 15字以内の要約
  reason: string;          // なぜこの位置か
}

// ─── Phase 1 データ ───
interface Phase1Data {
  cards: Card[];           // 8枚
  correctSlots: Record<string, string>;
  explanation: {
    overview: string;
    tiers: [string, string, string];
    distractorNote: string;
  };
  narrative: {
    correctReading: string;
    argSwap: { reading: string; contrast: string; };
  };
}

// ─── Phase 2 データ [v2] ───
interface Objection {
  id: string;
  text: string;                // 反論テキスト（30-50字）
  valid: boolean;              // true=正当, false=的外れ
  targetSlot: string;          // どのスロットへの反論か
  rebuttalOptions: string[];   // 維持理由の候補3つ
  correctRebuttalIndex: number;// valid=false時の正解index。valid=trueなら-1
  explanation: string;         // 結果画面用の解説
  autoRestructure?: Record<string, string>; // 受け入れ時の自動組替え結果
}

interface Phase2Data {
  objections: Objection[];     // 4枚
}

// ─── Phase 3 データ [v3] ───
interface Phase3Data {
  premiseChange: string;       // 前提変更の説明
  newCards: Card[];             // 新カード3枚（新結論1＋新論点or根拠2）
  newCorrectSlots: Record<string, string>; // 変更後の正解配置
  explanation: {
    overview: string;
    whatChanged: string;
    conclusion: string;        // 旧結論vs新結論の判断理由
  };
}

// ─── 問題（統合パッケージ）───
interface Question {
  id: string;
  title: string;
  situation: string;
  issue: string;
  phase1: Phase1Data;
  phase2?: Phase2Data;         // v2で追加
  phase3?: Phase3Data;         // v3で追加
}

// ─── スコア ───
interface RoundScore {
  phase1: {
    score: number;
    accuracy: number;
    tierScores: [number, number, number];
    timeLeft: number;
  };
  phase2?: {                   // v2で追加
    score: number;
    correct: number;
    total: number;
  };
  phase3?: {                   // v3で追加
    score: number;
    accuracy: number;
    tierScores: [number, number, number];
    timeLeft: number;
  };
  total: number;
}

// ─── 履歴 ───
interface HistoryEntry {
  date: string;
  time: string;
  questionId: string;
  questionTitle: string;
  isBasic: boolean;
  scores: RoundScore;
}
```

---

## 4. 問題データの構成

3レベル構成（Lv.1 / Lv.2 / Lv.3）。すべてのレベルを最初から選択可能。

| Level | 問題数 | ファイル | 生成方法 |
|---|---|---|---|
| Lv.1（基礎） | 5問 | `lib/questions-level1.ts` | ハードコード |
| Lv.2（応用） | 20問 | `lib/questions-level2.ts` | バッチ生成（セクション7） |
| Lv.3（実戦） | 70問 | `lib/questions-level3.ts` | バッチ生成（セクション7） |

集約は `lib/questions.ts` で `QUESTION_BANK: Record<Level, Question[]>` として行う。

### Lv.1（5問）

以下5問をハードコード。全データ（cards, correctSlots, explanation, narrative）は添付のプロトタイプコード `prototype/logic-tower.jsx` を参照して移植すること。論点カードは「〇〇か？」の問い形式に書き換えること（セクション7のルールを参照）。

| ID | タイトル | イシュー |
|----|----------|----------|
| f1 | 老舗旅館のインバウンド戦略 | この旅館はインバウンド需要を取り込むべきか？ |
| f2 | DX推進の優先順位 | DX投資の最優先領域はどこか？ |
| f3 | 新卒採用チャネルの見直し | 採用のメインチャネルをダイレクトリクルーティングに切り替えるべきか？ |
| f4 | 飲食チェーンの値上げ判断 | 主力メニューを値上げすべきか？ |
| f5 | リモートワーク制度の再設計 | 完全リモートから出社型に移行すべきか？ |

### Lv.2（20問）/ Lv.3（70問）

バッチ生成スクリプト（セクション7）で事前生成し、JSONとして格納。難易度のチューニング（業界の馴染み深さ、論点の見抜きやすさ、ノイズの紛らわしさ等）はセクション7で扱う。

### アンロック条件
- すべてのレベルを最初からプレイ可能。

---

## 5. Phase 1：論点タワー（v1で実装）

### 概要
- イシュー（状況＋問い）が表示される
- 8枚のカード（結論1・論点2・根拠3・ノイズ2）を「結論→論点→根拠」のピラミッドに配置
- 制限時間90秒
- スロット完全一致で採点

### 操作方法
1. 下のカードプールからカードをタップ → 選択状態になる
2. ピラミッドのスロットをタップ → カードが配置される
3. 配置済みスロットをタップ → カードが外れて選択状態になる
4. 「提出」ボタンで回答確定

### プレイ画面のUI構成
```
[タイマーバー ●●●●●●○○○○ 45s]

タイトル（小さめ、#F59E0B）
状況テキスト（#94A3B8、小さめ）
💡 イシュー（#E2E8F0 太字、左ボーダー#F59E0B）

[結論]  ┌──────────────────┐
        │   (スロット)       │
        └──────────────────┘

[論点]  ← 優先順位順 →
        ┌────────┐ ┌────────┐
        └────────┘ └────────┘

[根拠]  ← 優先順位順 →
        ┌──────┐ ┌──────┐ ┌──────┐
        └──────┘ └──────┘ └──────┘

--- カード（N枚 残り）---
[ カード1 ]
[ カード2 ]
...

[固定] === 提出する（N/6）===
```

### 空スロットの表示
- カード未選択時：「結論を配置」「論点(左)」等のプレースホルダー
- カード選択時：「▼ ここに配置」に変化

### アニメーション
- カード配置時：popIn（scale 0.9→1.03→1, 0.3s）
- 未選択でスロットタップ：shake（横揺れ 0.4s）
- タイマー色：残り30秒以下→黄色、15秒以下→赤

### 採点ロジック（`lib/scoring.ts`）
```
各スロットの完全一致: correctSlots[slotId] === placedCardId
正答1つ = +13.3pt（6つ全問正解で80pt）
ノイズをスロットに配置 = -13.3pt/枚
時間ボーナス = (残り秒数 / 90) × 20pt
最終スコア = max(0, min(100, 正答pt - ペナルティ + 時間ボーナス))
```

### 結果画面（v1ではPhase 1完了後に表示。v3以降は統合結果画面に移行）

**①スコアとランク**
S(90+), A(70+), B(50+), C(<50)。ランクアイコンを円で囲んで表示。

**②「あなたの構造を読むと…」**（ナラティブ読み上げ）
ユーザーの配置を「聞き手にどう伝わるか」の視点で分析。
- 結論が正しいか → ✅ or ❌
- 論点の左右が正しいか → ✅ / 🔄（入替）/ ❌
- 根拠の選択と順序 → ✅ / ⚡（順序違い）/ ❌
- ノイズ混入 → 指摘

ナラティブ生成ロジック（`lib/narrative.ts`）はプロトタイプコードの `buildNarr()` と `userReading()` 関数を移植すること。

**③ What-if比較**（論点左右入替時のみ表示）
正しい順序と逆順でどう印象が変わるかの対比。

**④ 模範構造の読み上げ**
`question.phase1.narrative.correctReading` をそのまま表示。

**⑤ スロット別詳細**（タップで展開）
各スロットの正解カードと、ユーザーの配置の差分。タップで「なぜこの位置か」の解説が展開。

**⑥ ノイズカード**
正しく除外できたかの判定と、「なぜノイズか」の解説。

### プロトタイプコードの参照箇所
添付の `prototype/logic-tower.jsx` の以下を参照して移植：
- 固定5問のデータ（cards, correctSlots, explanation, narrative）
- ゲームプレイのstate管理・UI・操作ハンドラ
- 結果画面のナラティブ生成（buildNarr, userReading関数）
- 成長グラフ（recharts AreaChart）
- スコア履歴の永続化ロジック

---

## 6. スタート画面・成長グラフ（v1で実装）

### スタート画面
- LOGICTOWERロゴ + サブタイトル「イシューから始める思考訓練」
- モード選択カード2枚
  - 📚 基礎編（厳選5問）— 最初からプレイ可能
  - 🏋️ 実践編（100問）— 5回プレイ後にアンロック。未達なら「🔒 あとN回」表示
- STARTボタン
- 成長グラフボタン（1回以上プレイ後に表示）
- 累計プレイ回数

### 成長グラフ画面
- 平均スコア・ベストスコア・トレンド（直近5回 vs 最初5回の差）
- スコア推移エリアチャート（recharts）
- 層別平均正答率バー（結論・論点・根拠）
- 直近プレイ履歴（タイトル・日時・スコア）
- v3以降：3軸レーダーチャート（MECE度/骨格安定度/適応速度）を追加

### データ永続化（`lib/storage.ts`）
- キー：`logic-tower-history`
- 保存データ：HistoryEntry の配列（最大200件、古いものから削除）
- 使用済み問題IDリストも保存（同じ問題が連続しないように）

---

## 7. 問題バッチ生成スクリプト（v1で実行）

### スクリプト: `scripts/generate-questions.ts`

Anthropic APIを使い、100問を一括生成してJSONファイルに出力する。**このスクリプトは開発時に1回だけ実行する。** ランタイムでは使わない。

### 実行方法
```bash
# .env.localにANTHROPIC_API_KEYを設定した上で
npx ts-node scripts/generate-questions.ts
```

### スクリプトの設計

```typescript
// 20業界 × 5テーマ = 100問を生成
const INDUSTRIES = [
  "フィンテックスタートアップ", "地方自治体", "大手小売チェーン", "医療法人",
  "物流会社", "EdTech企業", "不動産デベロッパー", "食品メーカー",
  "人材紹介会社", "保険会社", "アパレルブランド", "旅行代理店",
  "コンサルティングファーム", "自動車部品メーカー", "建設会社",
  "EC事業者", "出版社", "広告代理店", "農業法人", "介護事業者",
];

const THEMES = [
  "新規事業の撤退判断", "海外進出の是非", "M&Aの実行判断",
  "サブスクモデルへの転換", "AIツール導入の優先順位",
  // ... 計5テーマ（20×5=100問）
];

// 各問に対して3回のAPI呼び出し:
// 1. Phase 1データ生成（イシュー + カード8枚 + 解説 + ナラティブ）
// 2. Phase 2データ生成（模範構造に対する反論4枚）
// 3. Phase 3データ生成（前提変更 + 新カード3枚）
// → 1つのQuestionオブジェクトに統合
```

### Phase 1 生成プロンプト

```
あなたはMBA教授です。安宅和人『イシューからはじめよ』の方法論に基づき、構造化思考トレーニング用の問題を1問生成してください。

## イシュー設計の原則
- 「構造化せよ」「整理せよ」のような作業指示は使わない
- イシューは「答えを出す価値のある問い」であり、意思決定に直結する1つの問い
- 「〇〇すべきか？」のようにシンプルな1文

## カード設計ルール
- 結論1枚、論点2枚、根拠3枚、ノイズ2枚＝計8枚
- 論点は左が「推進理由/価値/Why/緊急性」、右が「制約条件/実現性/How/対策」
- **論点カードは「〇〇か？」というサブイシュー（問い）の形式で書くこと。トピック名やカテゴリラベル（例：「成長余地の存在」「リスクの管理可能性」）にしないこと。ピラミッド全体が「問い→答え」の連鎖になるよう設計する：イシュー（問い）→結論（答え）→論点（サブ問い）→根拠（サブ答え）。**
- 根拠は左が最重要データ、中央が補強データ、右が反証or内部データ
- ノイズは「一見関連あるが意思決定に直接影響しない」情報
- 全カードにphrase（15字以内の要約。論点カードのphraseも問い形式で）とreason（なぜこの位置かの説明）を付ける
- 結論は「〇〇すべき。ただし△△が条件」の形式
- 根拠には必ず具体的な数字を含める

## 出力（JSONのみ。マークダウンや説明は不要）
{
  "title": "15字以内のタイトル",
  "situation": "背景状況（60-80字）。事実のみ",
  "issue": "答えを出すべき問い（1文、20-30字）",
  "explanation": {
    "overview": "このイシューへの回答方針（60字）",
    "tiers": ["結論層の解説","論点層の解説：左右の順序理由","根拠層の解説：左中右の配置理由"],
    "distractorNote": "ノイズの見分け方（50字）"
  },
  "narrative": {
    "correctReading": "模範構造を文章で読み上げ（150字程度）",
    "argSwap": {
      "reading": "論点の左右を入れ替えた場合の読まれ方（80字）",
      "contrast": "正しい順序と逆順の対比。改行で区切り最後に原則1文（120字）"
    }
  },
  "cards": [
    {"id":"c1","text":"結論テキスト","type":"conclusion","tier":0,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c2","text":"根拠左","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"c3","text":"論点右（〇〇か？形式のサブ問い）","type":"argument","tier":1,"phrase":"〇〇か？","reason":""},
    {"id":"c4","text":"根拠中","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"c5","text":"論点左（〇〇か？形式のサブ問い）","type":"argument","tier":1,"phrase":"〇〇か？","reason":""},
    {"id":"c6","text":"根拠右","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"d1","text":"ノイズ1","type":"distractor","tier":-1,"phrase":"","reason":""},
    {"id":"d2","text":"ノイズ2","type":"distractor","tier":-1,"phrase":"","reason":""}
  ],
  "correctSlots": {"t0-0":"c1","t1-0":"c5","t1-1":"c3","t2-0":"c2","t2-1":"c4","t2-2":"c6"}
}
```

### Phase 2 生成プロンプト

```
以下のピラミッド構造（模範解答）に対して、反論カードを4枚生成してください。

## 模範構造
結論: {c1.text}
論点（左）: {c5.text}
論点（右）: {c3.text}
根拠（左）: {c2.text}
根拠（中）: {c4.text}
根拠（右）: {c6.text}

## ルール
- 4枚中、正当な反論を2-3枚、的外れな反論を1-2枚
- 正当な反論 = 構造の弱点を的確に突く（データの古さ、因果の飛躍、論点の漏れ等）
- 的外れな反論 = 一見鋭いが論理的に構造に影響しない（スコープ外、前提のすり替え等）
- 各反論に「維持理由の候補」3つを生成。的外れな反論には正解理由のindexを指定
- 正当な反論のcorrectRebuttalIndexは-1
- 「受け入れる」場合の自動組替え結果（autoRestructure）も定義

## 出力（JSON配列のみ）
[
  {
    "id": "obj1",
    "text": "反論テキスト（30-50字）",
    "valid": true,
    "targetSlot": "t2-0",
    "rebuttalOptions": ["候補1", "候補2", "候補3"],
    "correctRebuttalIndex": -1,
    "explanation": "解説（60字）",
    "autoRestructure": {"t2-0": "c6", "t2-2": "c2"}
  },
  ...4枚
]
```

### Phase 3 生成プロンプト

```
以下のビジネス問題に対して「前提変更」シナリオと新カード3枚を生成してください。

## 元の問題
タイトル: {title}
状況: {situation}
イシュー: {issue}
模範構造: {correctSlots}
カード: {cards}

## ルール
- 前提変更パターン（1つ選択）: リソース制約 / 環境変化 / ステークホルダー変化 / 時間制約 / 市場変化
- 新カード3枚: 新結論1枚 + 新論点or根拠2枚
- 新結論は旧結論と異なる方向性
- newCorrectSlots: 元8枚＋新3枚=11枚から正しい6枚と配置を指定
- 旧カードも正解に含まれうる（前提が変わっても有効な根拠は残す）

## 出力（JSONのみ）
{
  "premiseChange": "前提変更の説明（30-40字）",
  "newCards": [
    {"id":"n1","text":"新結論","type":"conclusion","tier":0,"phrase":"","reason":""},
    {"id":"n2","text":"新カード2","type":"argument|evidence","tier":1|2,"phrase":"","reason":""},
    {"id":"n3","text":"新カード3","type":"argument|evidence","tier":1|2,"phrase":"","reason":""}
  ],
  "newCorrectSlots": {"t0-0":"n1","t1-0":"...","t1-1":"...","t2-0":"...","t2-1":"...","t2-2":"..."},
  "explanation": {
    "overview": "なぜこの再構築が正解か（80字）",
    "whatChanged": "何が変わり何が残るべきか（60字）",
    "conclusion": "旧結論vs新結論の判断理由（60字）"
  }
}
```

### バッチ生成の注意事項
- 1問あたり3回のAPI呼び出し（Phase1→2→3）
- Phase2, 3はPhase1の生成結果を入力に使う（直列実行）
- 各レスポンスをJSON.parseし、パース失敗ならリトライ（最大3回）
- 10問ごとに中間保存（途中で止まっても再開可能にする）
- 生成完了後、`lib/questions-practice.ts` に `export const PRACTICE_QUESTIONS: Question[] = [...]` として出力
- モデル: `claude-sonnet-4-20250514`

---

## 8. Phase 2：60秒バトル（v2で実装）

### 概要
- Phase 1で組んだ模範構造に対してAI反論が飛ぶ
- 制限時間60秒
- 反論4枚（正当2-3枚、的外れ1-2枚）
- 各反論に対して「受け入れる」or「維持する」を判断

### Phase遷移
Phase 1の提出後、3秒のトランジション演出を挟んでPhase 2に自動遷移。

トランジション演出：
```
画面中央にフェードイン：
  ⚔️ Phase 2: 60秒バトル
  「この構造に反論が飛んできます」
  3秒後に自動で開始
```

### 構造の引き継ぎ
**常に模範構造を使用する。** Phase 1の結果に関わらず、模範構造（correctSlots）がピラミッドに表示され、それに対する反論に答える。

（理由：全問題の反論は事前生成されており、模範構造に対して設計されているため。）

### UIフロー

```
[タイマーバー ●●●●●○○○○○ 35s]
[Phase 2: 60秒バトル]

┌─── ピラミッド表示（読み取り専用）───┐
│  模範構造が表示される               │
│  反論対象のスロットがハイライト      │
└────────────────────────────────────┘

┌─── 反論カード（下からスライドイン）──┐
│  💬「そのデータ、3年前のものでは     │
│    ないですか？」                    │
│                                     │
│  [受け入れる]    [維持する]          │
└─────────────────────────────────────┘
```

**「受け入れる」選択時：**
- ピラミッドがautoRestructureの内容にアニメーション遷移
- 1.5秒後に次の反論カード出現

**「維持する」選択時：**
```
┌─── 反論理由の選択 ──────────────────┐
│  なぜこの構造を維持しますか？        │
│                                     │
│  ○ 候補1                           │
│  ○ 候補2                           │
│  ○ 候補3                           │
│                                     │
│  補足（任意）: [________]（20字以内）│
│                                     │
│  [確定]                             │
└─────────────────────────────────────┘
```

### 反論の表示間隔
- 60秒 ÷ 4枚 = 15秒間隔で出題
- ただし前の反論への回答が完了するまで次は出さない
- 時間切れの場合、未回答の反論は「無回答」として0pt

### 採点ロジック
```
各反論（25pt満点 × 4枚 = 100pt）：
  正当な反論(valid=true)を受け入れた → +25pt
  正当な反論を維持した → +0pt
  的外れな反論(valid=false)を維持＋理由選択が正解 → +25pt
  的外れな反論を維持＋理由選択が不正解 → +10pt
  的外れな反論を受け入れた → +0pt
  無回答（時間切れ） → +0pt
```

---

## 9. Phase 2 結果画面（v2で実装）

v2の時点では、Phase 1の結果画面の後にPhase 2の結果を追加表示。

### 表示内容
**①Phase 2スコア**
- 正答数 / 4
- 「骨格安定度」スコア（0-100）

**②反論ごとの判定**
各反論カードについて：
- ユーザーの選択（受け入れ/維持）
- 正解だったか
- 正当な反論 / 的外れだったか の表示
- タップで解説展開
- 維持した場合：選んだ理由が正解だったか

---

## 10. Phase 3：前提クラッシュ（v3で実装）

### 概要
- 突然の前提変更が発生
- 新カード3枚（新結論1＋新論点or根拠2）が追加
- 11枚から6枚を選んでピラミッドを再構築
- 制限時間90秒

### Phase遷移
Phase 2完了後、3秒のトランジション演出：
```
画面中央にスケールイン：
  ⚡ 前提変更 ⚡
  「予算が半分に削減された」
  カードプールが更新されます
  3秒後に自動で開始
```

### プレイ画面
- Phase 1と同じピラミッドUI
- ただしスロットは空の状態からスタート
- カードプール：元8枚＋新3枚＝11枚
- 新カードには「NEW」バッジを表示
- 画面上部に前提変更テキストを常時表示（赤背景）
- 90秒で6枚配置して提出

### 採点ロジック
Phase 1と同じ方式。newCorrectSlots との完全一致で採点。

---

## 11. 統合結果画面（v3で実装）

v3では、Phase 1-2-3の結果を1画面に統合表示。各Phaseの個別結果画面は非表示にし、3フェーズ完了後にまとめて表示。

### ①総合スコアとランク
```
加重平均：
  Phase1（MECE度）× 0.35
+ Phase2（骨格安定度）× 0.30
+ Phase3（適応速度）× 0.35
= 総合スコア（0-100）
```

### ②レーダーチャート
recharts の RadarChart で3軸表示：
- MECE度（Phase 1スコア）
- 骨格安定度（Phase 2スコア）
- 適応速度（Phase 3スコア）

### ③Phase別スコアカード
横並び3枚のカードでPhase別スコアを表示。タップで各Phaseの詳細に展開。

### ④各Phase詳細（タップ展開）
- Phase 1: ナラティブ + What-if + スロット別（セクション5の結果画面と同じ）
- Phase 2: 反論ごとの判定（セクション9と同じ）
- Phase 3: 前提変更の評価 + 旧vs新の構造比較 + スロット別

### ⑤成長グラフへのリンク
v3では成長グラフにレーダーチャートの推移を追加。直近5回の3軸平均 vs 全期間平均の比較。

---

## 12. UIデザインガイドライン

### カラーパレット
```
背景:          #0F172A (slate-900)
パネル背景:    #1E293B (slate-800)
ボーダー:      #334155 (slate-700)
テキスト主:    #E2E8F0 (slate-200)
テキスト副:    #94A3B8 (slate-400)
テキスト薄:    #64748B (slate-500)
結論カラー:    #F59E0B (amber-500)
論点カラー:    #3B82F6 (blue-500)
根拠カラー:    #6366F1 (indigo-500)
正解:          #22C55E (green-500)
不正解:        #EF4444 (red-500)
警告:          #FDE68A (amber-200)
Phase2アクセント: #8B5CF6 (purple-500)
```

### フォント
- `Noto Sans JP`, `Helvetica Neue`, sans-serif
- タイトル: weight 800, letter-spacing 6px
- 本文: weight 400, line-height 1.6

### レスポンシブ
- max-width: 480px, margin: 0 auto
- タッチ操作前提（タップでカード選択→タップで配置）
- 提出ボタン: position fixed, bottom 0, backdrop-filter blur
- テキスト入力（Phase 2補足）: inputmode="text", auto-focus

### アニメーション
- カード配置: popIn (scale 0.9→1.03→1, 0.3s ease)
- 空スロットタップ: shake (横揺れ 0.4s)
- Phase遷移: fadeIn (0.5s)
- 反論カード出現: slideUp (下からスライド, 0.4s)
- 前提変更: scaleIn (中央からスケール, 0.5s)
- タイマー色: >30s=緑, 15-30s=黄, <15s=赤

---

## 13. PWA設定

### manifest.json
```json
{
  "name": "LOGIC TOWER",
  "short_name": "LogicTower",
  "description": "イシューから始める構造化思考トレーニング",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#F59E0B",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
基本的なキャッシュ戦略（Cache First）で、アプリシェルと問題データをキャッシュ。オフラインでもプレイ可能にする。

### ホーム画面への追加
- iPhone: Safari → 共有 → ホーム画面に追加
- Android: Chrome → メニュー → ホーム画面に追加

---

## 14. 実装チェックリスト

### v1（Phase 1のみのアプリ）
- [ ] Next.jsプロジェクト初期化（App Router, Tailwind, recharts）
- [ ] 型定義（lib/types.ts）
- [ ] 基礎5問のデータ移植（lib/questions-basic.ts）
- [ ] 100問バッチ生成スクリプト作成・実行（scripts/generate-questions.ts）
- [ ] 共通コンポーネント（Timer, PyramidView）
- [ ] スタート画面（モード選択、アンロック表示）
- [ ] Phase 1 プレイ画面
- [ ] Phase 1 結果画面（ナラティブ + What-if + スロット詳細）
- [ ] 成長グラフ画面
- [ ] スコア履歴のlocalStorage永続化
- [ ] PWA設定（manifest.json, Service Worker, アイコン）
- [ ] Vercelデプロイ
- [ ] スマホ実機で動作確認

### v2（+Phase 2）
- [ ] Phase 2 プレイ画面（反論UI + 選択式理由 + 補足テキスト）
- [ ] Phase 1→2のトランジション演出
- [ ] Phase 2 結果画面
- [ ] Phase 2 採点ロジック
- [ ] 成長グラフに骨格安定度を追加
- [ ] スマホ実機で通しプレイ確認

### v3（+Phase 3 + 統合）
- [ ] Phase 3 プレイ画面（前提変更 + 新カード + 11枚→6枚選択）
- [ ] Phase 2→3のトランジション演出
- [ ] 統合結果画面（レーダーチャート + Phase別展開）
- [ ] Phase 3 採点ロジック
- [ ] 成長グラフにレーダーチャート追加
- [ ] 全Phase間のstate引き継ぎ
- [ ] スマホ実機で3Phase通しプレイ確認

---

## 15. 注意事項

- `.env.local` の `ANTHROPIC_API_KEY` はバッチ生成スクリプト実行時のみ使用。本番ビルドには含まれない
- localStorage のキーは `logic-tower-history` に統一
- Phase間の遷移はstateで管理。ページ遷移（ルーティング）は使わない（SPA構成）
- タイマーはPhase遷移時に自動リセット
- 問題の出題順：基礎編は出題済みIDを記録しローテーション。実践編はシャッフルして順に出題（重複回避）
- バッチ生成スクリプトの中間結果は `scripts/output/` に保存し、途中再開可能にする
- アイコンは仮画像でよい（後からデザイナーに差し替え可能な構成にする）
