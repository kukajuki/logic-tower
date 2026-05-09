# LOGIC TOWER — Claude Code 実装指示書 v3

## 0. この指示書の使い方

段階リリースの設計です。各バージョンの対象セクションだけを読んで順に実装してください。

| バージョン | 内容 | 対象セクション |
|---|---|---|
| v1 | Phase 1（Lv.1のみ） | 1〜7 |
| v1.1 | Lv.2・Lv.3の問題追加 | 8 |
| v2 | Phase 2（60秒バトル） | 9〜10 |
| v3 | Phase 3（前提クラッシュ）＋統合結果 | 11〜13 |

v1だけで完全に動くアプリとしてデプロイ可能。

---

## 1. プロジェクト概要

### コンセプト
安宅和人『イシューからはじめよ』の方法論に基づく、ビジネスの構造化思考トレーニングアプリ。スマホで毎日5分。

### 3つの力を鍛える

| Phase | 名前 | 時間 | 鍛える力 |
|---|---|---|---|
| 1 | 論点タワー | 90秒 | 構造を組む力（MECE度） |
| 2 | 60秒バトル | 60秒 | 構造を守る力（骨格安定度） |
| 3 | 前提クラッシュ | 90秒 | 構造を組み替える力（適応速度） |

### レベル別ハイブリッド設計

レベルが上がるにつれて「自分で考える範囲」が広がる。全レベル最初から選べる。

| レベル | 名前 | 問題数 | フロー |
|---|---|---|---|
| Lv.1 | 型を覚える | 5問 | イシュー提示済み → カード配置 |
| Lv.2 | 問いを選ぶ | 20問 | イシュー選択（4択）→ カード配置 |
| Lv.3 | 問いを分解する | 70問 | イシュー選択（4択）→ サブイシュー選択（5択から2つ）→ 根拠配置 |

### 設計原則
- **ランタイムのAPI呼び出しはゼロ。** 全95問を事前バッチ生成しアプリに同梱
- **ピラミッド全体が「問い→答え」の連鎖。** 論点カードはサブイシュー（問い）形式
- **カード9枚構成。** 結論1＋論点3＋根拠3＋ノイズ2。論点スロットは2つなので、優先度判断が必要

### 技術スタック
- Next.js (App Router)
- React + Tailwind CSS
- recharts（グラフ・レーダーチャート）
- localStorage（スコア履歴の永続化）
- PWA（manifest.json + Service Worker）
- デプロイ：Vercel

---

## 2. ディレクトリ構成

```
logic-tower/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── StartScreen.tsx          # スタート画面（レベル選択）
│   ├── IssueSelection.tsx       # イシュー選択画面 [Lv.2, Lv.3]
│   ├── SubIssueSelection.tsx    # サブイシュー選択画面 [Lv.3]
│   ├── PlayPhase1.tsx           # Phase 1: 論点タワー
│   ├── PlayPhase2.tsx           # Phase 2: 60秒バトル [v2]
│   ├── PlayPhase3.tsx           # Phase 3: 前提クラッシュ [v3]
│   ├── ResultPhase1.tsx         # Phase 1 結果画面
│   ├── ResultIntegrated.tsx     # 3Phase統合結果画面 [v3]
│   ├── StatsScreen.tsx          # 成長グラフ
│   ├── Timer.tsx
│   └── PyramidView.tsx
├── lib/
│   ├── types.ts
│   ├── questions-lv1.ts         # Lv.1 基礎5問
│   ├── questions-lv2.ts         # Lv.2 応用20問（バッチ生成）
│   ├── questions-lv3.ts         # Lv.3 実戦70問（バッチ生成）
│   ├── scoring.ts
│   ├── narrative.ts
│   └── storage.ts
├── scripts/
│   └── generate-questions.ts    # バッチ生成スクリプト（開発時1回のみ）
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── .env.local                   # ANTHROPIC_API_KEY（バッチ生成時のみ）
└── package.json
```

---

## 3. 型定義（`lib/types.ts`）

```typescript
// ─── カード ───
interface Card {
  id: string;              // "c1"〜"c6", "c7"(3枚目の論点), "d1", "d2", "n1"〜"n3"
  text: string;            // 本文（40-60字）
  type: "conclusion" | "argument" | "evidence" | "distractor";
  tier: number;            // 0=結論, 1=論点, 2=根拠, -1=ノイズ
  phrase: string;          // 15字以内の要約
  reason: string;          // なぜこの位置か / なぜ優先度が低いか
}

// ─── イシュー選択データ [Lv.2, Lv.3] ───
interface IssueSelection {
  correctIssue: string;            // 正解のイシュー文
  wrongIssues: {                   // 不正解3つ
    text: string;
    reason: string;                // なぜ不適切かの解説
  }[];
}

// ─── サブイシュー選択データ [Lv.3] ───
interface SubIssueSelection {
  candidates: {                    // 5つの候補
    text: string;                  // サブイシュー文（「〇〇か？」形式）
    isCorrect: boolean;            // 正解かどうか（2つがtrue）
    reason: string;                // なぜ正解/不正解かの解説
  }[];
}

// ─── Phase 1 データ ───
interface Phase1Data {
  cards: Card[];                   // 9枚（結論1＋論点3＋根拠3＋ノイズ2）
  correctSlots: Record<string, string>;  // 6スロットの正解配置
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
  text: string;
  valid: boolean;
  targetSlot: string;
  rebuttalOptions: string[];
  correctRebuttalIndex: number;    // valid=trueなら-1
  explanation: string;
  autoRestructure?: Record<string, string>;
}

interface Phase2Data {
  objections: Objection[];         // 4枚
}

// ─── Phase 3 データ [v3] ───
interface Phase3Data {
  premiseChange: string;
  newCards: Card[];                 // 新カード3枚
  newCorrectSlots: Record<string, string>;
  explanation: {
    overview: string;
    whatChanged: string;
    conclusion: string;
  };
}

// ─── 問題（統合パッケージ）───
interface Question {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  situation: string;
  issue: string;                   // Lv.1ではそのまま表示、Lv.2-3では正解として使用
  issueSelection?: IssueSelection; // Lv.2, Lv.3
  subIssueSelection?: SubIssueSelection; // Lv.3のみ
  phase1: Phase1Data;
  phase2?: Phase2Data;
  phase3?: Phase3Data;
}

// ─── スコア ───
interface RoundScore {
  issueCorrect?: boolean;          // Lv.2-3: イシュー選択の正誤
  subIssueCorrect?: number;        // Lv.3: サブイシュー正答数（0-2）
  phase1: {
    score: number;
    accuracy: number;
    tierScores: [number, number, number];
    timeLeft: number;
  };
  phase2?: {
    score: number;
    correct: number;
    total: number;
  };
  phase3?: {
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
  level: 1 | 2 | 3;
  scores: RoundScore;
}
```

---

## 4. カード構成（全レベル共通）

### 9枚構成
| 種類 | 枚数 | スロット数 | 説明 |
|---|---|---|---|
| 結論 | 1枚 | 1 | 「〇〇すべき。ただし△△が条件」形式 |
| 論点（サブイシュー）| 3枚 | 2 | 「〇〇か？」形式。3枚から優先度の高い2枚を選ぶ |
| 根拠 | 3枚 | 3 | 必ず具体的な数字を含む |
| ノイズ | 2枚 | 0 | 一見関連あるが意思決定に直接影響しない |

### 論点カードの設計原則
- **サブイシュー（問い）として書く。** トピック名やカテゴリラベルにしない
- 3枚のうち2枚が正解（correctSlotsに含まれる）
- 3枚目は「関連はあるが、このイシューの核心ではないサブイシュー」
- reasonフィールドに「なぜ優先度が低いか」を明記
- ピラミッド全体が「問い→答え」の連鎖になる設計

### 例（老舗旅館の問題）

```
メインイシュー：この旅館はインバウンドを取り込むべきか？

結論：段階的に取り込むべき。ただし既存顧客体験の毀損防止が前提条件

論点（サブイシュー）：
  ✓ 左：インバウンド市場に成長余地はあるか？
  ✓ 右：参入リスクは管理可能か？
  ✗ 3枚目：従業員のスキル転換は対応可能か？（重要だが今の意思決定の核ではない）

根拠：
  左：訪日客は年15%増、宿泊単価は国内客の1.8倍
  中：星野リゾートは顧客動線の分離設計で両立に成功
  右：常連客の満足度低下事例あり（口コミ-0.8pt）

ノイズ：
  - 旅館の建築様式は江戸時代から続く伝統工法
  - 円安傾向は日銀の金融政策に起因
```

---

## 5. レベル別フロー詳細

### Lv.1「型を覚える」

```
[イシュー提示] → [Phase 1: カード9枚を6スロットに配置] → [結果画面]
```

- イシューは最初から表示される
- プレイヤーはカード配置に集中

### Lv.2「問いを選ぶ」

```
[状況提示] → [イシュー選択: 4択] → [Phase 1: カード配置] → [結果画面]
```

**イシュー選択画面（`IssueSelection.tsx`）：**
```
状況テキスト（背景事実のみ）

この状況で、最も答えを出す価値がある問いはどれか？

○ この旅館はインバウンドを取り込むべきか？     ← 正解
○ 訪日客は今後も増え続けるのか？               ← 自社で答えが出ない
○ 旅館業界全体の生き残り戦略は何か？            ← スコープが広すぎる
○ 既存顧客の満足度をどう上げるか？              ← 論点のすり替え

[この問いで進む]
```

**間違ったイシューを選んだ場合：**
そのままPhase 1に進む。カード配置で「噛み合わない」体験をし、結果画面で「イシュー選択が間違っていた」とフィードバック。不正解の理由と正解のイシューを解説。

**不正解イシューのパターン（バッチ生成時のガイド）：**
- 自社でコントロールできない問い（マクロ環境、他社動向）
- スコープが広すぎる問い（業界全体、社会全体）
- 論点のすり替え（本来の課題から逸れた問い）

### Lv.3「問いを分解する」

```
[状況提示] → [イシュー選択: 4択] → [サブイシュー選択: 5択から2つ] → [根拠配置] → [結果画面]
```

**サブイシュー選択画面（`SubIssueSelection.tsx`）：**
```
イシュー：この旅館はインバウンドを取り込むべきか？

このイシューに答えるために、まず何を明らかにすべきか？
5つの問いから、最も重要な2つを選べ。

□ インバウンド市場に成長余地はあるか？          ← 正解
□ 参入リスクは管理可能か？                      ← 正解
□ 従業員のスキル転換は対応可能か？              ← 悪くないが核心ではない
□ 旅館の建築様式は外国人に受けるか？            ← 枝葉の問い
□ 円安は今後も続くか？                          ← 自社で答えられない

[この2つで進む]
```

**Phase 1（根拠配置）の変更点：**
Lv.3ではサブイシュー選択後にPhase 1に進む。この場合：
- 論点スロットにはプレイヤーが選んだ2つのサブイシューが自動配置される
- プレイヤーは結論1枚＋根拠3枚の配置に集中（4スロット）
- ノイズカード2枚＋不要な根拠カードが混在（計6枚から4枚を選ぶ）

**間違ったサブイシューを選んだ場合：**
そのまま進む。根拠配置で「このサブイシューに答える根拠がない」と気づく。結果画面で正解のサブイシューと比較解説。

---

## 6. Phase 1：論点タワー（v1で実装）

### 概要
- カード9枚を「結論(1)→論点(2)→根拠(3)」のピラミッドに配置
- 論点3枚からスロット2つ分を選ぶ判断が必要
- 制限時間90秒
- スロット完全一致で採点

### Lv.1のプレイ画面UI
```
[タイマーバー ●●●●●●○○○○ 45s]

タイトル（小さめ、#F59E0B）
状況テキスト（#94A3B8）
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
[ カード1 ][ カード2 ]...

[固定] === 提出する（N/6）===
```

### 操作方法
1. カードをタップ → 選択状態
2. スロットをタップ → カード配置
3. 配置済みスロットをタップ → カード取り出し

### 採点ロジック
```
各スロットの完全一致: correctSlots[slotId] === placedCardId
正答1つ = +13.3pt（6スロット全問正解で80pt）
ノイズをスロットに配置 = -13.3pt/枚
時間ボーナス = (残り秒数 / 90) × 20pt
最終スコア = max(0, min(100, 正答pt - ペナルティ + 時間ボーナス))
```

### 結果画面

**①スコアとランク**
S(90+), A(70+), B(50+), C(<50)

**②イシュー選択の結果**（Lv.2-3のみ）
正解/不正解の表示。不正解の場合、選んだイシューの何が問題かを解説。

**③サブイシュー選択の結果**（Lv.3のみ）
正答数(0-2)と、各候補の解説。

**④「あなたの構造を読むと…」**
ユーザーの配置をナラティブで読み上げ。聞き手にどう伝わるか分析。

**⑤ What-if比較**（論点左右入替時）
正しい順序と逆順の印象の違い。

**⑥ 模範構造の読み上げ**
問い→答えの連鎖として読み上げ。

**⑦ スロット別詳細**（タップ展開）
各スロットの正解カードとユーザー配置の差分。3枚目の論点（不正解の論点）についても「なぜ優先度が低いか」を解説。

---

## 7. スタート画面・成長グラフ・PWA（v1で実装）

### スタート画面
```
LOGIC TOWER
イシューから始める思考訓練

┌─────────────────────────┐
│ Lv.1  型を覚える         │
│ 5問・イシュー提示済み     │
└─────────────────────────┘

┌─────────────────────────┐
│ Lv.2  問いを選ぶ          │
│ 20問・イシュー4択から選択  │
└─────────────────────────┘

┌─────────────────────────┐
│ Lv.3  問いを分解する       │
│ 70問・イシュー選択＋分解   │
└─────────────────────────┘

[📈 成長グラフ]
累計N回プレイ
```

全レベル最初から選べる。Lv.2・Lv.3は問題データがまだない場合は「準備中」と表示しグレーアウト。

### 成長グラフ
- スコア推移エリアチャート
- レベル別のプレイ回数・平均スコア
- 層別平均正答率バー（結論・論点・根拠）
- 直近プレイ履歴
- v3以降: 3軸レーダーチャート追加

### データ永続化
- キー: `logic-tower-history`
- 最大200件保存
- 使用済み問題IDリスト管理（重複回避）

### PWA設定
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

---

## 8. 問題バッチ生成スクリプト（v1.1で実行）

### スクリプト: `scripts/generate-questions.ts`

Anthropic APIで90問（Lv.2: 20問＋Lv.3: 70問）を一括生成。開発時に1回だけ実行。

### Lv.2 生成プロンプト

```
あなたはMBA教授です。安宅和人『イシューからはじめよ』に基づく構造化思考トレーニングの問題を1問生成してください。

## レベル: Lv.2（問いを選ぶ）
プレイヤーは4つのイシュー候補から正解を選んだ後、カード配置に進みます。

## イシュー選択の設計
- correctIssue: 答えを出す価値がある問い（1文、「〇〇か？」形式）
- wrongIssues: 不正解3つ。それぞれ以下のパターンから1つずつ:
  1. 自社でコントロールできない問い（マクロ環境・他社動向に依存）
  2. スコープが広すぎる問い（業界全体・社会全体に及ぶ）
  3. 論点のすり替え（本来の課題から逸れた問い）
- 各wrongIssueにreason（なぜ不適切かの解説）を付ける

## カード設計（9枚）
- 結論1枚: 「〇〇すべき。ただし△△が条件」形式
- 論点3枚: 「〇〇か？」というサブイシュー（問い）形式。トピック名やラベルにしない
  - 2枚が正解（correctSlotsに含まれる）
  - 3枚目は関連あるが核心ではないサブイシュー
- 根拠3枚: 必ず具体的な数字を含む
- ノイズ2枚: 一見関連あるが意思決定に直接影響しない

## ピラミッド構造の原則
- 論点左 = 推進理由/価値/Why/緊急性のサブイシュー
- 論点右 = 制約条件/実現性/How/対策のサブイシュー
- 根拠左 = 最重要データ、中央 = 補強データ、右 = 反証or内部データ
- ピラミッド全体が「問い→答え」の連鎖になること

## 出力（JSONのみ）
{
  "title": "15字以内",
  "situation": "背景状況（60-80字）。事実のみ",
  "issue": "正解のイシュー（1文、「〇〇か？」形式）",
  "issueSelection": {
    "correctIssue": "（issueと同じ）",
    "wrongIssues": [
      {"text": "不正解1", "reason": "なぜ不適切か"},
      {"text": "不正解2", "reason": "なぜ不適切か"},
      {"text": "不正解3", "reason": "なぜ不適切か"}
    ]
  },
  "explanation": {
    "overview": "回答方針（60字）",
    "tiers": ["結論層の解説","論点層の解説","根拠層の解説"],
    "distractorNote": "ノイズの見分け方（50字）"
  },
  "narrative": {
    "correctReading": "模範構造の読み上げ（150字）",
    "argSwap": {"reading": "左右入替時の読まれ方（80字）", "contrast": "対比（120字）"}
  },
  "cards": [
    {"id":"c1","text":"結論","type":"conclusion","tier":0,"phrase":"","reason":""},
    {"id":"c2","text":"根拠左","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"c3","text":"論点右（サブイシュー）","type":"argument","tier":1,"phrase":"","reason":""},
    {"id":"c4","text":"根拠中","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"c5","text":"論点左（サブイシュー）","type":"argument","tier":1,"phrase":"","reason":""},
    {"id":"c6","text":"根拠右","type":"evidence","tier":2,"phrase":"","reason":""},
    {"id":"c7","text":"論点3枚目（優先度低いサブイシュー）","type":"argument","tier":1,"phrase":"","reason":"なぜ核心ではないか"},
    {"id":"d1","text":"ノイズ1","type":"distractor","tier":-1,"phrase":"","reason":""},
    {"id":"d2","text":"ノイズ2","type":"distractor","tier":-1,"phrase":"","reason":""}
  ],
  "correctSlots": {"t0-0":"c1","t1-0":"c5","t1-1":"c3","t2-0":"c2","t2-1":"c4","t2-2":"c6"}
}
```

### Lv.3 生成プロンプト

Lv.2のプロンプトに加えて以下を追加:

```
## サブイシュー選択の設計
- 5つの候補を生成。2つが正解（cards内のc5, c3と一致）、3つが不正解
- 不正解のサブイシューパターン:
  1. c7と同じ「関連あるが核心ではない」問い
  2. 枝葉の問い（実行レベルの詳細に踏み込みすぎ）
  3. 自社で答えられない問い

## 追加出力フィールド
"subIssueSelection": {
  "candidates": [
    {"text": "サブイシュー文（〇〇か？）", "isCorrect": true, "reason": "解説"},
    {"text": "...", "isCorrect": true, "reason": "..."},
    {"text": "...", "isCorrect": false, "reason": "なぜ不正解か"},
    {"text": "...", "isCorrect": false, "reason": "..."},
    {"text": "...", "isCorrect": false, "reason": "..."}
  ]
}
```

### Phase 2 生成プロンプト（全レベル共通）

```
以下の模範構造に対して反論カード4枚を生成してください。

## 模範構造
結論: {c1.text}
サブイシュー（左）: {c5.text} → 根拠: {c2.text}
サブイシュー（右）: {c3.text} → 根拠: {c4.text}, {c6.text}

## ルール
- 4枚中、正当な反論を2-3枚、的外れな反論を1-2枚
- 各反論に「維持理由の候補」3つ（的外れの場合、正解indexを指定）
- 「受け入れる」場合の自動組替え結果も定義

## 出力（JSON配列のみ）
[{"id":"obj1","text":"反論（30-50字）","valid":true/false,"targetSlot":"t2-0","rebuttalOptions":["","",""],"correctRebuttalIndex":-1or0-2,"explanation":"解説","autoRestructure":{}}]
```

### Phase 3 生成プロンプト（全レベル共通）

```
以下の問題に対して「前提変更」シナリオと新カード3枚を生成してください。

## ルール
- 前提変更パターン: リソース制約/環境変化/ステークホルダー変化/時間制約/市場変化
- 新カード3枚: 新結論1枚 + 新論点or根拠2枚
- 新結論は旧結論と異なる方向性
- newCorrectSlots: 元9枚＋新3枚=12枚から正しい6枚と配置を指定

## 出力（JSONのみ）
{"premiseChange":"（30-40字）","newCards":[...],"newCorrectSlots":{...},"explanation":{...}}
```

### バッチ生成の実行方法
```bash
# .env.localにANTHROPIC_API_KEYを設定
npx ts-node scripts/generate-questions.ts
```
- 1問あたり3回のAPI呼び出し（Phase1→2→3を直列）
- 10問ごとに中間保存
- パース失敗時はリトライ（最大3回）
- モデル: claude-sonnet-4-20250514

---

## 9. Phase 2：60秒バトル（v2で実装）

### 概要
- 模範構造に対してAI反論が飛ぶ（事前生成済み）
- 制限時間60秒、反論4枚
- 各反論に「受け入れる」or「維持する」で判断
- 「維持する」場合: 理由を3択から選択＋任意で補足テキスト（20字以内）

### Phase遷移
Phase 1提出後、3秒トランジション → Phase 2開始

### UIフロー

**反論表示:**
```
[タイマーバー 35s]
[Phase 2: 60秒バトル]

┌── ピラミッド（読み取り専用、反論対象ハイライト）──┐
└──────────────────────────────────────────────────┘

┌── 反論カード（スライドイン）──┐
│ 💬「そのデータ、3年前では？」  │
│ [受け入れる]  [維持する]      │
└───────────────────────────────┘
```

**「維持する」選択時:**
```
なぜこの構造を維持しますか？
○ 候補1  ○ 候補2  ○ 候補3
補足（任意）: [________]
[確定]
```

### 採点
```
正当な反論を受け入れた → +25pt
的外れな反論を維持＋理由正解 → +25pt
的外れな反論を維持＋理由不正解 → +10pt
正当な反論を維持 → +0pt
的外れな反論を受け入れた → +0pt
合計: 0-100pt
```

---

## 10. Phase 2 結果画面（v2で実装）

Phase 1結果の後に追加表示。
- 骨格安定度スコア
- 反論ごとの判定（正解/不正解、正当/的外れ）
- タップで解説展開

---

## 11. Phase 3：前提クラッシュ（v3で実装）

### 概要
- 前提変更が発生
- 新カード3枚追加（新結論1＋新論点or根拠2）
- Lv.1-2: 12枚から6枚を選んで再構築（90秒）
- Lv.3: Phase 3でもサブイシュー選択の余地あり

### Phase遷移
Phase 2完了後、3秒トランジション（前提変更テキスト表示）→ Phase 3開始

### プレイ画面
- Phase 1と同じピラミッドUI（スロット空からスタート）
- カードプール: 元9枚＋新3枚＝12枚
- 新カードに「NEW」バッジ
- 前提変更テキスト常時表示

### 採点
Phase 1と同方式。newCorrectSlotsとの完全一致。

---

## 12. 統合結果画面（v3で実装）

3フェーズ完了後にまとめて表示。

### 総合スコア
```
Phase1（MECE度）× 0.35 + Phase2（骨格安定度）× 0.30 + Phase3（適応速度）× 0.35
```

### レーダーチャート
recharts RadarChartで3軸表示。

### Phase別詳細（タップ展開）
各Phaseの詳細結果。

---

## 13. UIデザインガイドライン

### カラー
```
背景: #0F172A    パネル: #1E293B    ボーダー: #334155
テキスト主: #E2E8F0  副: #94A3B8  薄: #64748B
結論: #F59E0B    論点: #3B82F6    根拠: #6366F1
正解: #22C55E    不正解: #EF4444   警告: #FDE68A
```

### フォント
`Noto Sans JP`, `Helvetica Neue`, sans-serif

### アニメーション
- カード配置: popIn (0.3s)
- 空スロットタップ: shake (0.4s)
- Phase遷移: fadeIn (0.5s)
- 反論出現: slideUp (0.4s)
- 前提変更: scaleIn (0.5s)

### レスポンシブ
- max-width: 480px
- タッチ操作前提
- 提出ボタン: position fixed bottom

---

## 14. 実装チェックリスト

### v1
- [ ] Next.jsプロジェクト（既存のものを修正）
- [ ] 型定義更新
- [ ] Lv.1 基礎5問データ（9枚構成・イシュー型論点）
- [ ] スタート画面（3レベル選択）
- [ ] Phase 1 プレイ画面
- [ ] Phase 1 結果画面（ナラティブ含む）
- [ ] 成長グラフ
- [ ] localStorage永続化
- [ ] PWA設定
- [ ] Vercelデプロイ

### v1.1
- [ ] バッチ生成スクリプト作成
- [ ] Lv.2 20問生成
- [ ] Lv.3 70問生成
- [ ] イシュー選択画面（Lv.2）
- [ ] サブイシュー選択画面（Lv.3）
- [ ] Lv.3用のPhase 1変更（論点自動配置）

### v2
- [ ] Phase 2 プレイ画面
- [ ] Phase 1→2トランジション
- [ ] Phase 2 結果画面
- [ ] Phase 2 採点ロジック

### v3
- [ ] Phase 3 プレイ画面
- [ ] Phase 2→3トランジション
- [ ] 統合結果画面（レーダーチャート）
- [ ] Phase 3 採点ロジック

---

## 15. 注意事項

- `.env.local`のAPIキーはバッチ生成時のみ使用。本番ビルドに含めない
- localStorageキー: `logic-tower-history`
- Phase間遷移はstate管理（ルーティング不使用、SPA構成）
- 問題出題: レベル内でシャッフル、使用済みID記録で重複回避
- 9枚構成でのcorrectSlots: 論点スロット2つに対して正解の論点は2枚（c5, c3）。3枚目の論点（c7）をスロットに置くと不正解
- Lv.3のPhase 1では論点スロットが自動配置される。プレイヤーが操作するのは結論1＋根拠3の4スロット
