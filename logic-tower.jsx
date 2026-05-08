import { useState, useEffect, useCallback, useRef } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

// ─── FIXED QUESTIONS (基礎編) ────────────────────────────────────────────────
const FIXED_QS = [
  {
    id: "f1", title: "老舗旅館のインバウンド戦略",
    situation: "創業80年の温泉旅館。訪日観光客の急増を受けてインバウンド対応の投資提案が上がったが、常連客からは「雰囲気が変わるのでは」と懸念の声も出ている。",
    issue: "この旅館はインバウンド需要を取り込むべきか？",
    explanation: { overview: "Yes/No判断を「攻め」と「守り」のMECEな論点で支える構造。", tiers: ["立場＋条件を一文で言い切る。", "左に攻め（成長余地）→右に守り（リスク管理）。推進理由→条件の順。", "左から攻めの定量→守りの事例→守りの反証。ポジティブ→ネガティブの順。"], distractorNote: "「So What?」テストで結論への道筋が描けなければノイズ。" },
    narrative: { correctReading: "「段階的にインバウンドを取り込むべき（条件付き）」——まず「成長余地がある」という攻め。訪日客15%増・単価1.8倍が裏付け。次に「リスクは管理できる」という守り。星野リゾートの成功事例と常連客満足度低下の反証データ。攻めで価値を示し、守りで安心感を与える——聞き手は「やろう」と決断できます。", argSwap: { reading: "守り→攻めの順だと「リスクは大丈夫。あと成長もするかも」と消極的に聞こえます。推進力が弱まり、提案のトーンが守り腰になります。", contrast: "攻め→守り：「やる価値がある。かつリスクも管理できる」＝推進力のある提案\n守り→攻め：「リスクは大丈夫。あと成長もするかも」＝消極的で腰が引けた提案\n\n推進したいなら「なぜやるか」の熱量を先に示すのが鉄則です。" } },
    cards: [
      { id: "c1", text: "段階的に取り込むべき。ただし既存顧客体験の毀損防止が前提条件", type: "conclusion", tier: 0, phrase: "段階的に取り込むべき（条件付き）", reason: "立場＋条件を明示。結論は常にActionableに。" },
      { id: "c2", text: "市場機会の大きさ：訪日客は年15%増、宿泊単価は国内客の1.8倍", type: "evidence", tier: 2, phrase: "訪日客15%増・単価1.8倍", reason: "攻めの定量データ。最も強い推進根拠を左端に。" },
      { id: "c3", text: "参入リスクの管理可能性", type: "argument", tier: 1, phrase: "リスクは管理できる", reason: "守りの論点を右に。攻めとバランスを取る。" },
      { id: "c4", text: "競合の星野リゾートは顧客動線の分離設計で両立に成功", type: "evidence", tier: 2, phrase: "星野リゾートが動線分離で成功", reason: "守りの裏付け事例。中央に配置。" },
      { id: "c5", text: "成長余地の存在：未開拓市場へのアクセス", type: "argument", tier: 1, phrase: "成長余地がある", reason: "攻めの論点を左に。「なぜやるか」の軸。" },
      { id: "c6", text: "常連客の満足度低下事例あり（騒音・文化摩擦で口コミ評価-0.8pt）", type: "evidence", tier: 2, phrase: "常連客満足度-0.8pt", reason: "反証データを右端に。議論に奥行きを出す。" },
      { id: "d1", text: "旅館の建築様式は江戸時代から続く伝統工法である", type: "distractor", tier: -1, phrase: "建築は伝統工法", reason: "意思決定に直接影響しない事実。" },
      { id: "d2", text: "最近の円安傾向は日銀の金融政策に起因する", type: "distractor", tier: -1, phrase: "円安は日銀政策起因", reason: "マクロ背景。固有の判断根拠にならない。" },
    ],
    correctSlots: { "t0-0": "c1", "t1-0": "c5", "t1-1": "c3", "t2-0": "c2", "t2-1": "c4", "t2-2": "c6" },
  },
  {
    id: "f2", title: "DX推進の優先順位",
    situation: "従業員800名の中堅製造業。全社DX推進の号令がかかったが、生産管理・営業・人事の3部門がそれぞれ予算を要求している。",
    issue: "DX投資の最優先領域はどこか？",
    explanation: { overview: "優先順位判断。結論で「何から着手するか」を明言し、判断基準を構造的に提示。", tiers: ["優先領域＋展開順序を明示。", "左にROI→右に変革準備度。価値→実現性の順。", "左から緊急性データ→他社比較→社内データ。外部→内部の順。"], distractorNote: "政府ガイドラインやAIトレンドは業界文脈であり固有の優先順位判断には使えない。" },
    narrative: { correctReading: "「生産管理を最優先に段階展開」——まず「ROIが最も高い」。属人化率68%・損失2.3億円の緊急性と他社PoC成功率78%が裏付け。次に「組織が受容できる」。ITリテラシーが最高という社内データ。「価値が高い×実行できる」の両軸で最適解を示す構造です。", argSwap: { reading: "実現性→価値の順だと「やりやすいからやる」と消去法に見えます。戦略的判断ではなく安易な選択の印象。", contrast: "ROI→実現性：「価値が最も高い。かつ実行もできる」＝戦略的判断\n実現性→ROI：「やりやすい。あとROIも良い」＝消去法に見える\n\n「なぜここに投資するか」の価値を先に示すのが効果的です。" } },
    cards: [
      { id: "c1", text: "生産管理のデジタル化を最優先とし、段階的に営業・人事へ展開すべき", type: "conclusion", tier: 0, phrase: "生産管理を最優先に段階展開", reason: "優先領域＋展開順序を明示。" },
      { id: "c2", text: "生産現場の属人化率68%、ベテラン退職で年間損失2.3億円リスク", type: "evidence", tier: 2, phrase: "属人化率68%・損失2.3億円", reason: "緊急性データを左端に。" },
      { id: "c3", text: "投資対効果が最も高い領域の特定", type: "argument", tier: 1, phrase: "ROIが最も高い", reason: "価値面の論点を左に。" },
      { id: "c4", text: "現場の受容性：生産管理部門のITリテラシー調査でスコア最高", type: "evidence", tier: 2, phrase: "ITリテラシーが最高", reason: "内部データを右端で補完。" },
      { id: "c5", text: "組織の変革準備度による実現可能性", type: "argument", tier: 1, phrase: "組織が受容できる", reason: "実現性を右に。価値→実現性の順。" },
      { id: "c6", text: "同業他社のPoC成功率：生産管理78%、営業45%、人事32%", type: "evidence", tier: 2, phrase: "PoC成功率：生産管理78%", reason: "客観的外部データを中央に。" },
      { id: "d1", text: "経済産業省はDX推進ガイドラインを2024年に改訂した", type: "distractor", tier: -1, phrase: "経産省ガイドライン", reason: "背景情報。固有の判断根拠にならない。" },
      { id: "d2", text: "ChatGPTの登場以降、AI関連の投資が世界的に急増している", type: "distractor", tier: -1, phrase: "世界的AI投資急増", reason: "トレンドであり固有の優先順位とは無関係。" },
    ],
    correctSlots: { "t0-0": "c1", "t1-0": "c3", "t1-1": "c5", "t2-0": "c2", "t2-1": "c6", "t2-2": "c4" },
  },
  {
    id: "f3", title: "新卒採用チャネルの見直し",
    situation: "従業員300名のIT企業。ナビサイト経由の採用コストが年々上昇し、人事部からダイレクトリクルーティングへの全面移行案が提出された。",
    issue: "採用のメインチャネルをダイレクトリクルーティングに切り替えるべきか？",
    explanation: { overview: "チャネル移行の意思決定。推進理由と制約条件をバランスよく構造化。", tiers: ["段階的移行＋前提条件を示す。", "左にコスト効率（推進理由）→右に運用負荷（制約）。Why→Riskの順。", "左からコスト比較→品質効果→負荷実態。"], distractorNote: "労働市場統計やブランディング一般論はチャネル選択の直接材料にならない。" },
    narrative: { correctReading: "「段階的にダイレクトへ移行（体制整備が前提）」——まず「コスト効率が改善できる」。単価42万vs78万、定着率92%vs76%が裏付け。次に「運用負荷のリスクがある」。月40時間の追加工数。推進理由で価値を示し制約で注意点を示す——上司は正しくリソース判断できます。", argSwap: { reading: "制約→推進の順だと「大変だけどコストは安い」と消極的に聞こえ、推進力が失われます。", contrast: "推進→制約：「大きなメリットがある。リスクはこう管理する」＝前向きな提案\n制約→推進：「リスクはあるがメリットもある」＝後ろ向きな報告\n\n「変える価値」を先に示してから制約をケアする順序が鉄則です。" } },
    cards: [
      { id: "c1", text: "段階的にダイレクトリクルーティングへ移行すべき。ただし運用体制の整備が前提", type: "conclusion", tier: 0, phrase: "段階的にダイレクトへ移行（体制整備前提）", reason: "移行方向＋前提条件を明示。" },
      { id: "c2", text: "ダイレクト経由の採用単価42万円、ナビサイト経由は78万円（前年実績）", type: "evidence", tier: 2, phrase: "採用単価42万vs78万", reason: "コスト効率のデータを左端。" },
      { id: "c3", text: "採用コスト効率の改善余地", type: "argument", tier: 1, phrase: "コスト効率が改善できる", reason: "最大の推進理由を左に。" },
      { id: "c4", text: "ダイレクト経由の1年後定着率92%、ナビ経由は76%", type: "evidence", tier: 2, phrase: "定着率92%vs76%", reason: "品質差を中央に。" },
      { id: "c5", text: "社内の運用負荷増大リスク", type: "argument", tier: 1, phrase: "運用負荷が増大する", reason: "制約条件を右に。" },
      { id: "c6", text: "スカウト文面作成に人事1名あたり月40時間追加が必要（同規模企業調査）", type: "evidence", tier: 2, phrase: "月40時間の追加工数", reason: "負荷の定量化を右端。" },
      { id: "d1", text: "2025年の大卒求人倍率は1.75倍で売り手市場が継続", type: "distractor", tier: -1, phrase: "求人倍率1.75倍", reason: "市場全体の話。チャネル選択に無関係。" },
      { id: "d2", text: "採用ブランディングにはSNS運用が不可欠と言われている", type: "distractor", tier: -1, phrase: "SNSブランディング", reason: "一般論でチャネル判断材料にならない。" },
    ],
    correctSlots: { "t0-0": "c1", "t1-0": "c3", "t1-1": "c5", "t2-0": "c2", "t2-1": "c4", "t2-2": "c6" },
  },
  {
    id: "f4", title: "飲食チェーンの値上げ判断",
    situation: "全国150店舗の定食チェーン。原材料費が前年比23%上昇し、利益率が急激に悪化。経営会議で値上げの是非が議題に上がった。",
    issue: "主力メニューを値上げすべきか？",
    explanation: { overview: "不人気施策の意思決定。「やるべきか」＋「影響最小化」まで踏み込む。", tiers: ["値上げ幅＋緩和策をセットに。", "左に財務的必要性（やらないとどうなる）→右に顧客影響の制御（やるならどうする）。", "左から利益率データ→競合事例→自社調査。外部→内部の順。"], distractorNote: "為替や食品ロス統計は背景情報。固有の値上げ判断には使えない。" },
    narrative: { correctReading: "「8%の段階的値上げ＋緩和策」——まず「値上げしなければ事業が危ない」。利益率8.2%→2.1%の危機データ。次に「顧客離反は制御できる」。松屋の成功事例と許容度調査。「やらないと危ない」で危機感を、「やっても大丈夫」で安心感を——不人気施策を通す黄金構成です。", argSwap: { reading: "対策→緊急性の順だと「お客さんは大丈夫そう。あと利益も厳しい」と切迫感が薄まります。", contrast: "緊急性→対策：「このままでは危ない。でも対策すれば影響は抑えられる」＝危機感＋安心感\n対策→緊急性：「影響は抑えられる。あと利益も厳しい」＝危機感が伝わらず先送りされる\n\n不人気施策は「やらない場合の危機」を先に示すのが鉄板です。" } },
    cards: [
      { id: "c1", text: "8%の段階的値上げを実施。サイドメニュー増量とセット割引で顧客離反を緩和", type: "conclusion", tier: 0, phrase: "8%値上げ＋緩和策", reason: "値上げ幅＋緩和策セット。" },
      { id: "c2", text: "原材料費が前年比23%上昇、営業利益率が8.2%→2.1%に悪化", type: "evidence", tier: 2, phrase: "利益率8.2%→2.1%", reason: "緊急性データを左端。" },
      { id: "c3", text: "値上げなしでは事業継続性が危機的", type: "argument", tier: 1, phrase: "値上げしなければ事業が危ない", reason: "緊急性の論点を左に。" },
      { id: "c4", text: "競合の松屋は10%値上げ後もリピート率を維持（品質訴求戦略）", type: "evidence", tier: 2, phrase: "松屋は値上げでもリピート維持", reason: "競合事例を中央に。" },
      { id: "c5", text: "値上げ幅と顧客離反率の制御可能性", type: "argument", tier: 1, phrase: "顧客離反は制御できる", reason: "対策面を右に。" },
      { id: "c6", text: "自社アンケート：5%値上げなら許容83%、10%なら許容52%、15%なら許容21%", type: "evidence", tier: 2, phrase: "許容度：8%圏内なら過半数OK", reason: "自社データを右端。" },
      { id: "d1", text: "ドル円レートは150円台で推移し、輸入食材価格に影響を与えている", type: "distractor", tier: -1, phrase: "ドル円150円台", reason: "マクロ背景。値上げ幅の根拠にならない。" },
      { id: "d2", text: "食品ロス削減推進法により、外食産業全体で廃棄量削減が求められている", type: "distractor", tier: -1, phrase: "食品ロス削減法", reason: "規制動向であり値上げとは別論点。" },
    ],
    correctSlots: { "t0-0": "c1", "t1-0": "c3", "t1-1": "c5", "t2-0": "c2", "t2-1": "c4", "t2-2": "c6" },
  },
  {
    id: "f5", title: "リモートワーク制度の再設計",
    situation: "従業員1,200名のSaaS企業。コロナ禍で完全リモートに移行したが、部門間連携の遅延が顕在化し、経営陣から出社回帰の声が出ている。",
    issue: "完全リモートから出社型に移行すべきか？",
    explanation: { overview: "働き方変更の意思決定。移行の必然性と実現条件を構造化。", tiers: ["一律ではなく職種別＋段階移行。", "左に組織的価値（Why）→右に受容性確保（How）。必然性→実現方法の順。", "左から生産性データ→離職リスク→他社事例。問題→リスク→解決策の流れ。"], distractorNote: "オフィス市況や世代論は一般論。固有の制度設計根拠にならない。" },
    narrative: { correctReading: "「職種別に段階移行（6ヶ月トライアル）」——まず「対面に組織的価値がある」。プロジェクト完了速度34%低下が裏付け。次に「従業員の離反をどう防ぐか」。38%が転職検討というリスクとSalesforceの成功事例。「なぜ変えるか」で納得感、「どう変えるか」で安心感——制度変更はこの順序が重要です。", argSwap: { reading: "受容性→価値の順だと「社員が辞めないよう気をつけつつ出社させたい」と防衛策に聞こえます。戦略的意義が伝わりません。", contrast: "価値→受容性：「出社にはこれだけの価値がある。移行方法はこうする」＝戦略的判断\n受容性→価値：「反発を抑えつつ出社の価値もある」＝防衛的で場当たり的\n\n「なぜ変えるか」のWhyを先にしてから「どう変えるか」のHowを述べるのが原則です。" } },
    cards: [
      { id: "c1", text: "職種別に週2〜3出社の段階的移行を実施。6ヶ月のトライアル期間を設定", type: "conclusion", tier: 0, phrase: "職種別に段階移行（6ヶ月トライアル）", reason: "柔軟性＋段階移行でリスク最小化。" },
      { id: "c2", text: "部門横断プロジェクトの完了速度が完全リモート後に34%低下", type: "evidence", tier: 2, phrase: "完了速度34%低下", reason: "生産性データを左端に。" },
      { id: "c3", text: "対面コラボレーションの組織的価値", type: "argument", tier: 1, phrase: "対面に組織的価値がある", reason: "Why論点を左に。" },
      { id: "c4", text: "社内サーベイ：「週3以上の出社義務なら転職検討」が38%", type: "evidence", tier: 2, phrase: "38%が転職検討", reason: "離反リスクを中央に。" },
      { id: "c5", text: "従業員エンゲージメントと離職リスクの管理", type: "argument", tier: 1, phrase: "離反をどう防ぐか", reason: "How論点を右に。" },
      { id: "c6", text: "Salesforceは職種別ハイブリッド制で離職率を移行前水準に維持", type: "evidence", tier: 2, phrase: "Salesforceが職種別で成功", reason: "解決事例を右端に。" },
      { id: "d1", text: "都心のオフィス空室率は2024年に6.2%まで上昇した", type: "distractor", tier: -1, phrase: "空室率6.2%", reason: "不動産市況。制度設計に無関係。" },
      { id: "d2", text: "Z世代は柔軟な働き方を重視する傾向が強い", type: "distractor", tier: -1, phrase: "Z世代の傾向", reason: "世代論一般。固有の根拠にならない。" },
    ],
    correctSlots: { "t0-0": "c1", "t1-0": "c3", "t1-1": "c5", "t2-0": "c2", "t2-1": "c4", "t2-2": "c6" },
  },
];

const TL = ["結論", "論点", "根拠"];
const TS = [1, 2, 3];
const TT = 90;
const TC = ["#F59E0B", "#3B82F6", "#6366F1"];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const SK = "lt-hist-v3";
const loadH = async () => { try { const r = await window.storage.get(SK); return r ? JSON.parse(r.value) : []; } catch { return []; } };
const saveH = async (h) => { try { await window.storage.set(SK, JSON.stringify(h)); } catch {} };

// ─── AI QUESTION GENERATOR ──────────────────────────────────────────────────
const GEN_PROMPT = `あなたはMBA教授です。安宅和人『イシューからはじめよ』の方法論に基づき、ビジネスの構造化思考トレーニング用の問題を1問生成してください。

## イシュー設計の原則
- 「構造化せよ」「整理せよ」のような作業指示は絶対に使わない
- イシューは「答えを出す価値のある問い」であり、意思決定に直結する1つの問いにする
- 「〇〇すべきか？」のようにシンプルな1文。条件や補足の問いは付けない（ヒントになるため）
- situationで背景事実を、issueで答えるべき問いを明確に分離する

## カード設計ルール
- 結論1枚、論点2枚、根拠3枚、ノイズ2枚＝計8枚
- 論点は左が「推進理由/価値/Why/緊急性」、右が「制約条件/実現性/How/対策」
- 根拠は左が最重要データ、中央が補強データ、右が反証or内部データ
- ノイズは「一見関連あるが意思決定に直接影響しない」情報
- 全カードにphrase（15字以内の要約）とreason（なぜこの位置かの説明）を付ける
- 結論は「〇〇すべき。ただし△△が条件」の形式
- 根拠には必ず具体的な数字を含める

## 出力（JSONのみ。マークダウンや説明は不要）
{
  "title": "15字以内のタイトル",
  "situation": "背景状況（60-80字）。事実のみ、判断は含めない",
  "issue": "答えを出すべき問い（1文、20-30字）。「〇〇すべきか？」形式",
  "explanation": {
    "overview": "このイシューへの回答方針（60字程度）",
    "tiers": ["結論層の解説（40字）","論点層の解説：左右の順序理由（60字）","根拠層の解説：左中右の配置理由（60字）"],
    "distractorNote": "ノイズの見分け方（50字）"
  },
  "narrative": {
    "correctReading": "模範構造を文章で読み上げ。結論→左論点→左根拠→右論点→右根拠の流れで（150字程度）",
    "argSwap": {
      "reading": "論点の左右を入れ替えた場合の読まれ方（80字）",
      "contrast": "正しい順序と逆順の対比。それぞれ1行で示し改行で区切る。最後に原則を1文（120字）"
    }
  },
  "cards": [
    {"id":"c1","text":"結論カードのテキスト（40-60字）","type":"conclusion","tier":0,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c2","text":"根拠左（最重要データ）","type":"evidence","tier":2,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c3","text":"論点右（制約/実現性/How）","type":"argument","tier":1,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c4","text":"根拠中央（補強データ）","type":"evidence","tier":2,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c5","text":"論点左（推進/価値/Why）","type":"argument","tier":1,"phrase":"15字以内","reason":"配置理由"},
    {"id":"c6","text":"根拠右（反証/内部データ）","type":"evidence","tier":2,"phrase":"15字以内","reason":"配置理由"},
    {"id":"d1","text":"ノイズ1","type":"distractor","tier":-1,"phrase":"15字以内","reason":"なぜノイズか"},
    {"id":"d2","text":"ノイズ2","type":"distractor","tier":-1,"phrase":"15字以内","reason":"なぜノイズか"}
  ],
  "correctSlots": {"t0-0":"c1","t1-0":"c5","t1-1":"c3","t2-0":"c2","t2-1":"c4","t2-2":"c6"}
}`;

const INDUSTRIES = [
  "フィンテックスタートアップ", "地方自治体", "大手小売チェーン", "医療法人",
  "物流会社", "EdTech企業", "不動産デベロッパー", "食品メーカー",
  "人材紹介会社", "保険会社", "アパレルブランド", "旅行代理店",
  "コンサルティングファーム", "自動車部品メーカー", "建設会社",
  "EC事業者", "出版社", "広告代理店", "農業法人", "介護事業者",
];

const THEMES = [
  "新規事業の撤退判断", "海外進出の是非", "M&Aの実行判断", "事業ポートフォリオの再編",
  "サブスクモデルへの転換", "組織再編の方針", "AIツール導入の優先順位",
  "人材育成投資の配分", "ブランドリポジショニング", "サプライチェーンの見直し",
  "新オフィスへの移転判断", "料金体系の刷新", "パートナーシップ戦略",
  "顧客セグメントの絞り込み", "内製化vs外注の判断", "ESG対応の優先度",
];

async function generateQuestion() {
  const ind = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const userMsg = `業界：${ind}　テーマ：${theme}\nこの組み合わせで問題を1問生成してください。JSONのみ出力。`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: GEN_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  // Validate
  if (!parsed.cards || parsed.cards.length !== 8) throw new Error("Invalid card count");
  if (!parsed.correctSlots || !parsed.correctSlots["t0-0"]) throw new Error("Missing slots");
  parsed.id = "ai-" + Date.now();
  return parsed;
}

// ─── NARRATIVE BUILDER ──────────────────────────────────────────────────────
function buildNarr(q, slots) {
  const get = (s) => { const c = slots[s]; return c ? q.cards.find((x) => x.id === c) : null; };
  const cc = get("t0-0"), al = get("t1-0"), ar = get("t1-1"), el = get("t2-0"), em = get("t2-1"), er = get("t2-2");
  const parts = [];
  if (!cc) parts.push({ t: "x", m: "結論が未配置。聞き手は「結局どうすべき？」がわかりません。" });
  else if (cc.type === "distractor") parts.push({ t: "x", m: `結論にノイズ「${cc.phrase}」が配置されています。方向性が見えません。` });
  else if (cc.tier !== 0) parts.push({ t: "x", m: `結論に「${cc.phrase}」を配置。これは${TL[cc.tier >= 0 ? cc.tier : 2]}レベルの情報で、結論としては${cc.tier === 1 ? "抽象的すぎ" : "具体的すぎ"}ます。` });
  else parts.push({ t: "o", m: `結論「${cc.phrase}」——正しく配置されています。` });

  if (al && ar) {
    const sw = al.id === q.correctSlots["t1-1"] && ar.id === q.correctSlots["t1-0"];
    if (sw) parts.push({ t: "s", m: `論点カードは正しいですが左右が逆。あなたの構造だと「まず${al.phrase}、次に${ar.phrase}」と読めます。` });
    else if (al.id === q.correctSlots["t1-0"] && ar.id === q.correctSlots["t1-1"]) parts.push({ t: "o", m: `論点「${al.phrase}」→「${ar.phrase}」の順序も正解。自然な流れです。` });
    else {
      const iss = [];
      if (al.tier !== 1) iss.push(`左の論点に${al.tier === -1 ? "ノイズ" : TL[al.tier]}「${al.phrase}」`);
      if (ar.tier !== 1) iss.push(`右の論点に${ar.tier === -1 ? "ノイズ" : TL[ar.tier]}「${ar.phrase}」`);
      if (iss.length) parts.push({ t: "x", m: iss.join("、") + "が配置されています。論点層には「結論を支える判断軸」を置きます。" });
      else parts.push({ t: "p", m: `論点は正しい層ですが配置が異なります。「${al.phrase}」→「${ar.phrase}」と読めます。` });
    }
  } else parts.push({ t: "x", m: `論点の${!al && !ar ? "両方" : !al ? "左" : "右"}が未配置。判断の軸が欠けています。` });

  const evs = [el, em, er].filter(Boolean);
  const evOk = evs.filter((c) => c.tier === 2).length;
  const evDist = evs.filter((c) => c.type === "distractor").length;
  if (!evs.length) parts.push({ t: "x", m: "根拠が未配置。データなしでは主張が空論です。" });
  else if (evOk === 3 && !evDist) {
    const allEx = [["t2-0", el], ["t2-1", em], ["t2-2", er]].every(([s, c]) => c?.id === q.correctSlots[s]);
    parts.push(allEx ? { t: "o", m: "根拠3枚の選択と順序も完璧です。" } : { t: "p", m: "根拠3枚は正しいですが順序が異なります。左から重要度順に並べるとスムーズです。" });
  } else {
    const msgs = [];
    if (evDist) msgs.push(`${evDist}枚のノイズが根拠に混入`);
    const wrongTier = evs.filter((c) => c.tier !== 2 && c.tier !== -1);
    if (wrongTier.length) msgs.push(`「${wrongTier[0].phrase}」は根拠ではなく${TL[wrongTier[0].tier]}レベル`);
    parts.push({ t: "x", m: msgs.join("。") + "。" });
  }
  return parts;
}

function userReading(q, slots) {
  const g = (s) => { const c = slots[s]; return c ? q.cards.find((x) => x.id === c) : null; };
  const cc = g("t0-0"), al = g("t1-0"), ar = g("t1-1");
  if (!cc || !al || !ar || cc.type === "distractor") return null;
  return `「${cc.phrase}」——なぜか？ まず「${al.phrase}」。次に「${ar.phrase}」。`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LogicTower() {
  const [scr, setScr] = useState("start");
  const [q, setQ] = useState(null);
  const [cards, setCards] = useState([]);
  const [slots, setSlots] = useState({});
  const [sel, setSel] = useState(null);
  const [timer, setTimer] = useState(TT);
  const [res, setRes] = useState(null);
  const [expC, setExpC] = useState(null);
  const [shk, setShk] = useState(null);
  const [pop, setPop] = useState(null);
  const [hist, setHist] = useState([]);
  const [usedF, setUsedF] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [mode, setMode] = useState(null); // "basic" | "ai"
  const tR = useRef(null);
  const sR = useRef(false);

  const totalPlays = hist.length;
  const aiUnlocked = totalPlays >= 5;

  useEffect(() => { loadH().then(setHist); }, []);

  const LOAD_MSGS = ["業界データを調査中...", "イシューを設計中...", "ノイズカードを仕込み中...", "難易度を調整中...", "模範解答を検証中..."];

  const startFixed = useCallback(() => {
    let av = FIXED_QS.filter((x) => !usedF.includes(x.id));
    if (!av.length) { av = FIXED_QS; setUsedF([]); }
    const qn = av[Math.floor(Math.random() * av.length)];
    setUsedF((p) => [...p, qn.id]);
    setQ(qn); setCards(shuffle(qn.cards)); setSlots({}); setSel(null);
    setTimer(TT); setRes(null); setExpC(null); sR.current = false;
    setScr("play");
  }, [usedF]);

  const startAI = useCallback(async () => {
    setLoading(true); setLoadMsg(LOAD_MSGS[0]);
    let idx = 0;
    const iv = setInterval(() => { idx = (idx + 1) % LOAD_MSGS.length; setLoadMsg(LOAD_MSGS[idx]); }, 1800);
    try {
      const qn = await generateQuestion();
      clearInterval(iv);
      setQ(qn); setCards(shuffle(qn.cards)); setSlots({}); setSel(null);
      setTimer(TT); setRes(null); setExpC(null); sR.current = false;
      setLoading(false); setScr("play");
    } catch (e) {
      clearInterval(iv); setLoading(false);
      console.error("AI generation failed:", e);
      startFixed(); // fallback
    }
  }, [startFixed]);

  const startGame = useCallback(() => {
    if (mode === "ai") startAI(); else startFixed();
  }, [mode, startAI, startFixed]);

  const submit = useCallback(() => {
    if (sR.current) return; sR.current = true; clearTimeout(tR.current);
    let sc = 0, ts = [0, 0, 0];
    for (let t = 0; t < 3; t++) for (let i = 0; i < TS[t]; i++) { const s = `t${t}-${i}`; if (slots[s] === q.correctSlots[s]) { ts[t]++; sc++; } }
    const dp = Object.values(slots).filter((c) => q.cards.find((x) => x.id === c)?.type === "distractor").length;
    const tb = Math.round((timer / TT) * 20);
    const fs = Math.max(0, Math.min(100, Math.round(((sc - dp) / 6) * 80) + tb));
    const cr = {};
    for (const [sid, cid] of Object.entries(slots)) { const t = parseInt(sid[1]); cr[cid] = { ps: sid, pt: t, ex: q.correctSlots[sid] === cid, di: q.cards.find((x) => x.id === cid)?.type === "distractor" }; }
    const asw = slots["t1-0"] === q.correctSlots["t1-1"] && slots["t1-1"] === q.correctSlots["t1-0"];
    const r = { score: fs, acc: sc, ts, dp, tb, tl: timer, cr, asw };
    setRes(r);
    const en = { d: new Date().toISOString().slice(0, 10), t: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }), qi: q.id, qt: q.title, s: fs, a: sc, ts: [...ts], ai: q.id?.toString().startsWith("ai") };
    const nh = [...hist, en].slice(-100); setHist(nh); saveH(nh);
    setScr("result");
  }, [q, slots, timer, hist]);

  useEffect(() => {
    if (scr === "play" && timer > 0) { tR.current = setTimeout(() => setTimer((t) => t - 1), 1000); return () => clearTimeout(tR.current); }
    if (scr === "play" && timer === 0) submit();
  }, [scr, timer, submit]);

  const gc = (s) => { const c = slots[s]; return c ? q.cards.find((x) => x.id === c) : null; };
  const ip = (c) => Object.values(slots).includes(c);
  const fc = Object.keys(slots).length;
  const onC = (c) => { if (res) return; if (ip(c)) { const s = Object.keys(slots).find((k) => slots[k] === c); if (s) setSlots((p) => { const n = { ...p }; delete n[s]; return n; }); setSel(null); } else setSel(sel === c ? null : c); };
  const onS = (s) => { if (res) return; if (slots[s]) { const c = slots[s]; setSlots((p) => { const n = { ...p }; delete n[s]; return n; }); setSel(c); return; } if (!sel) { setShk(s); setTimeout(() => setShk(null), 500); return; } setSlots((p) => ({ ...p, [s]: sel })); setPop(s); setTimeout(() => setPop(null), 400); setSel(null); };

  // ── LOADING ──
  if (loading) return (
    <div style={S.c}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20 }}>
      <div style={{ width: 48, height: 48, border: "3px solid #334155", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: 14, color: "#F59E0B", fontWeight: 600, letterSpacing: 1 }}>AI問題を生成中</p>
      <p style={{ fontSize: 12, color: "#64748B", textAlign: "center" }}>{loadMsg}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div></div>
  );

  // ── START ──
  if (scr === "start") return (
    <div style={S.c}><div style={S.ss}>
      <svg width="48" height="48" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 8 }}>
        <rect x="24" y="4" width="16" height="12" rx="2" fill="#F59E0B" opacity="0.9" /><rect x="12" y="20" width="18" height="12" rx="2" fill="#3B82F6" opacity="0.9" /><rect x="34" y="20" width="18" height="12" rx="2" fill="#3B82F6" opacity="0.9" /><rect x="2" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" /><rect x="23" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" /><rect x="44" y="36" width="18" height="12" rx="2" fill="#6366F1" opacity="0.9" />
      </svg>
      <h1 style={S.ti}>LOGIC TOWER</h1>
      <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, letterSpacing: 2 }}>イシューから始める思考訓練</p>

      {/* Mode cards */}
      <div style={{ width: "100%", maxWidth: 340, marginTop: 24 }}>
        <div onClick={() => { setMode("basic"); }} style={{ ...S.mc, border: mode === "basic" ? "2px solid #F59E0B" : "1.5px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>📚 基礎編</span>
            <span style={{ fontSize: 10, color: "#64748B" }}>厳選5問</span>
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "6px 0 0", lineHeight: 1.5 }}>品質保証された問題で「型」を覚える</p>
        </div>

        <div onClick={() => { if (aiUnlocked) setMode("ai"); }} style={{ ...S.mc, marginTop: 8, border: mode === "ai" ? "2px solid #8B5CF6" : "1.5px solid #334155", opacity: aiUnlocked ? 1 : 0.45, cursor: aiUnlocked ? "pointer" : "default" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>🤖 実践編</span>
            {aiUnlocked ? <span style={{ fontSize: 10, color: "#8B5CF6" }}>AI生成・無限</span>
              : <span style={{ fontSize: 10, color: "#64748B" }}>🔒 あと{5 - totalPlays}回でアンロック</span>}
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "6px 0 0", lineHeight: 1.5 }}>
            {aiUnlocked ? "毎回AIが未知の問題を生成。応用力を鍛える" : "基礎編を5回プレイすると解放されます"}
          </p>
        </div>
      </div>

      <button style={{ ...S.pb, marginTop: 20, opacity: mode ? 1 : 0.4, cursor: mode ? "pointer" : "default" }} onClick={() => { if (mode) startGame(); }}>
        {mode === "ai" ? "AI問題に挑戦" : "START"}
      </button>

      {hist.length > 0 && <button style={{ ...S.sb, marginTop: 10 }} onClick={() => setScr("stats")}>📈 成長グラフ</button>}
      {hist.length > 0 && <p style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>累計{totalPlays}回プレイ</p>}
    </div></div>
  );

  // ── STATS ──
  if (scr === "stats") {
    const cd = hist.map((h, i) => ({ n: `#${i + 1}`, s: h.s, ai: h.ai }));
    const avg = hist.length ? Math.round(hist.reduce((a, h) => a + h.s, 0) / hist.length) : 0;
    const best = hist.length ? Math.max(...hist.map((h) => h.s)) : 0;
    const r5 = hist.slice(-5); const ra = r5.length ? Math.round(r5.reduce((a, h) => a + h.s, 0) / r5.length) : 0;
    const e5 = hist.slice(0, Math.min(5, hist.length)); const ea = e5.length ? Math.round(e5.reduce((a, h) => a + h.s, 0) / e5.length) : 0;
    const trend = hist.length >= 4 ? ra - ea : 0;
    const ta = [0, 1, 2].map((t) => { const v = hist.map((h) => h.ts[t]); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "0"; });
    const aiCount = hist.filter((h) => h.ai).length;

    return (
      <div style={S.c}><div style={{ padding: "20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>📈 成長グラフ</h2>
          <button onClick={() => setScr("start")} style={S.back}>戻る</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          {[{ l: "平均", v: avg, c: "#F59E0B" }, { l: "ベスト", v: best, c: "#22C55E" }, { l: "トレンド", v: `${trend >= 0 ? "+" : ""}${trend}`, c: trend >= 0 ? "#22C55E" : "#EF4444" }].map((x, i) => (
            <div key={i} style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
              <p style={{ fontSize: 9, color: "#64748B", margin: 0 }}>{x.l}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: x.c, margin: 0 }}>{x.v}</p>
            </div>
          ))}
        </div>
        {aiCount > 0 && <p style={{ fontSize: 10, color: "#8B5CF6", margin: "0 0 8px", textAlign: "center" }}>🤖 AI問題 {aiCount}回 / 基礎 {totalPlays - aiCount}回</p>}
        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: "12px 4px 4px" }}>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={cd} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="95%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="n" tick={{ fontSize: 8, fill: "#64748B" }} /><YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 6, fontSize: 10 }} /><Area type="monotone" dataKey="s" stroke="#F59E0B" strokeWidth={2} fill="url(#sg)" dot={{ r: 2, fill: "#F59E0B" }} name="スコア" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: 12, marginTop: 8 }}>
          {[0, 1, 2].map((t) => (<div key={t} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, color: TC[t], fontWeight: 700 }}>{TL[t]}</span><span style={{ fontSize: 10, color: "#94A3B8" }}>{ta[t]}/{TS[t]}</span></div>
            <div style={{ height: 4, backgroundColor: "#0F172A", borderRadius: 2 }}><div style={{ height: "100%", width: `${(parseFloat(ta[t]) / TS[t]) * 100}%`, backgroundColor: TC[t], borderRadius: 2 }} /></div>
          </div>))}
        </div>
        <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: 12, marginTop: 8 }}>
          {hist.slice(-10).reverse().map((h, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #334155" }}>
            <div><span style={{ fontSize: 10, color: "#CBD5E1" }}>{h.ai ? "🤖 " : ""}{h.qt}</span><span style={{ fontSize: 8, color: "#475569", marginLeft: 4 }}>{h.d}</span></div>
            <span style={{ fontSize: 14, fontWeight: 800, color: h.s >= 90 ? "#F59E0B" : h.s >= 70 ? "#3B82F6" : h.s >= 50 ? "#8B5CF6" : "#EF4444" }}>{h.s}</span>
          </div>))}
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}><button style={S.pb} onClick={() => { setScr("start"); }}>戻る</button></div>
      </div></div>
    );
  }

  // ── RESULT ──
  if (scr === "result" && res) {
    const g = res.score >= 90 ? { l: "S", c: "#F59E0B" } : res.score >= 70 ? { l: "A", c: "#3B82F6" } : res.score >= 50 ? { l: "B", c: "#8B5CF6" } : { l: "C", c: "#EF4444" };
    const narr = buildNarr(q, slots);
    const ur = userReading(q, slots);
    const isAI = q.id?.toString().startsWith("ai");

    return (
      <div style={S.c}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "22px 12px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#64748B", marginBottom: 10 }}>RESULT {isAI && <span style={{ color: "#8B5CF6" }}>🤖 AI</span>}</p>
        <div style={{ width: 96, height: 96, borderRadius: "50%", border: `3px solid ${g.c}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: g.c }}>{g.l}</span><span style={{ fontSize: 13, color: "#94A3B8" }}>{res.score}</span>
        </div>

        <div style={{ width: "100%", maxWidth: 400, padding: "8px 10px", backgroundColor: "#1E293B", borderRadius: 7, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div><p style={{ fontSize: 8, color: "#64748B", margin: 0 }}>一致</p><p style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>{res.acc}/6</p></div>
          {TL.map((l, i) => <div key={i}><p style={{ fontSize: 8, color: TC[i], margin: 0 }}>{l}</p><p style={{ fontSize: 15, fontWeight: 800, color: res.ts[i] === TS[i] ? "#22C55E" : "#E2E8F0", margin: 0 }}>{res.ts[i]}/{TS[i]}</p></div>)}
          <div><p style={{ fontSize: 8, color: "#64748B", margin: 0 }}>時間+</p><p style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>{res.tb}</p></div>
        </div>

        <div style={{ width: "100%", maxWidth: 400, marginTop: 16 }}>
          {/* Narrative 1: your reading */}
          <div style={{ ...S.nb, borderLeftColor: "#F59E0B" }}>
            <p style={S.nt}>🔍 あなたの構造を読むと…</p>
            {ur && <p style={{ fontSize: 12, lineHeight: 1.8, color: "#CBD5E1", margin: "0 0 10px", fontStyle: "italic" }}>{ur}</p>}
            {narr.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", marginBottom: 6, gap: 5 }}>
                <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>{n.t === "o" ? "✅" : n.t === "s" ? "🔄" : n.t === "p" ? "⚡" : "❌"}</span>
                <p style={{ fontSize: 11, lineHeight: 1.7, color: n.t === "o" ? "#86EFAC" : n.t === "x" ? "#FCA5A5" : "#FDE68A", margin: 0 }}>{n.m}</p>
              </div>
            ))}
          </div>

          {/* Narrative 2: what-if swap */}
          {res.asw && q.narrative?.argSwap && (
            <div style={{ ...S.nb, borderLeftColor: "#8B5CF6", marginTop: 10 }}>
              <p style={S.nt}>🔄 左右が逆だとどう読める？</p>
              <p style={{ fontSize: 11, lineHeight: 1.8, color: "#FDE68A", margin: "0 0 8px" }}>{q.narrative.argSwap.reading}</p>
              <div style={{ backgroundColor: "#0F172A", borderRadius: 7, padding: 10 }}>
                <p style={{ fontSize: 10, lineHeight: 1.8, color: "#94A3B8", margin: 0, whiteSpace: "pre-line" }}>{q.narrative.argSwap.contrast}</p>
              </div>
            </div>
          )}

          {/* Model reading */}
          {q.narrative?.correctReading && (
            <div style={{ ...S.nb, borderLeftColor: "#22C55E", marginTop: 10 }}>
              <p style={S.nt}>✨ 模範構造はこう読める</p>
              <p style={{ fontSize: 11, lineHeight: 1.8, color: "#86EFAC", margin: 0 }}>{q.narrative.correctReading}</p>
            </div>
          )}

          {/* Why order matters - show if not swapped but args partially wrong */}
          {!res.asw && res.ts[1] < 2 && q.narrative?.argSwap && (
            <div style={{ ...S.nb, borderLeftColor: "#8B5CF6", marginTop: 10 }}>
              <p style={S.nt}>💡 論点の順序はなぜ重要か？</p>
              <div style={{ backgroundColor: "#0F172A", borderRadius: 7, padding: 10 }}>
                <p style={{ fontSize: 10, lineHeight: 1.8, color: "#94A3B8", margin: 0, whiteSpace: "pre-line" }}>{q.narrative.argSwap.contrast}</p>
              </div>
            </div>
          )}

          {/* Detail review */}
          <p style={{ ...S.nt, marginTop: 16, marginBottom: 6 }}>📐 スロット別詳細</p>
          {[0, 1, 2].map((tier) => (
            <div key={tier} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "1px 6px", borderRadius: 3, backgroundColor: TC[tier] + "22", color: TC[tier] }}>{TL[tier]}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: res.ts[tier] === TS[tier] ? "#22C55E" : "#EF4444" }}>{res.ts[tier] === TS[tier] ? "✓" : `${res.ts[tier]}/${TS[tier]}`}</span>
              </div>
              <p style={{ fontSize: 9, lineHeight: 1.6, color: "#64748B", margin: "0 0 3px" }}>{q.explanation?.tiers?.[tier]}</p>
              {Array.from({ length: TS[tier] }).map((_, i) => {
                const sid = `t${tier}-${i}`, cCid = q.correctSlots[sid], card = q.cards.find((c) => c.id === cCid);
                const ok = slots[sid] === cCid, ek = `r-${sid}`, isE = expC === ek;
                const ucr = res.cr[cCid]; let st = null;
                if (!ok) {
                  st = ucr ? `あなたは「${TL[ucr.pt]}の${["左", "中", "右"][parseInt(ucr.ps.split("-")[1])]}」に配置` : "未配置";
                  const uh = slots[sid]; if (uh) { const wc = q.cards.find((c) => c.id === uh); if (wc) st += ` ／ ここには「${wc.phrase || wc.text?.slice(0, 15)}」`; }
                }
                const pl = TS[tier] > 1 ? `（${["左", "中", "右"][i]}）` : "";
                return (<div key={sid} style={{ marginBottom: 3 }}>
                  <div onClick={() => setExpC(isE ? null : ek)} style={{ padding: "7px 9px", backgroundColor: "#1E293B", borderRadius: 6, borderLeft: `3px solid ${ok ? "#22C55E" : "#EF4444"}`, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ok ? "#22C55E" : "#EF4444", marginRight: 4, flexShrink: 0 }}>{ok ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 9, lineHeight: 1.5, color: "#CBD5E1", flex: 1 }}>{pl && <span style={{ color: "#64748B", fontSize: 8 }}>{pl} </span>}{card?.text}</span>
                      <span style={{ fontSize: 8, color: "#64748B", marginLeft: 2, flexShrink: 0, transform: isE ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                    </div>
                    {st && <span style={{ display: "block", fontSize: 8, color: "#F59E0B", marginTop: 2, paddingLeft: 14 }}>→ {st}</span>}
                  </div>
                  {isE && card?.reason && <div style={{ padding: "7px 9px 7px 12px", marginTop: 1, backgroundColor: "#334155", borderRadius: "0 0 6px 6px", borderLeft: "3px solid #475569" }}><p style={{ fontSize: 9, lineHeight: 1.7, color: "#94A3B8", margin: 0 }}><strong style={{ color: "#CBD5E1" }}>なぜこの位置か：</strong>{card.reason}</p></div>}
                </div>);
              })}
            </div>
          ))}
          {/* Distractors */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "1px 6px", borderRadius: 3, backgroundColor: "#EF444422", color: "#EF4444" }}>ノイズ</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: res.dp === 0 ? "#22C55E" : "#EF4444" }}>{res.dp === 0 ? "✓" : `${res.dp}枚混入`}</span>
            </div>
            <p style={{ fontSize: 9, lineHeight: 1.6, color: "#64748B", margin: "0 0 3px" }}>{q.explanation?.distractorNote}</p>
            {q.cards.filter((c) => c.type === "distractor").map((card) => {
              const placed = !!res.cr[card.id]; const ek = `d-${card.id}`; const isE = expC === ek;
              return (<div key={card.id} style={{ marginBottom: 3 }}>
                <div onClick={() => setExpC(isE ? null : ek)} style={{ padding: "7px 9px", backgroundColor: "#1E293B", borderRadius: 6, borderLeft: `3px solid ${placed ? "#EF4444" : "#22C55E"}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: placed ? "#EF4444" : "#22C55E", marginRight: 4, flexShrink: 0 }}>{placed ? "✗" : "✓"}</span>
                    <span style={{ fontSize: 9, lineHeight: 1.5, color: "#CBD5E1", flex: 1 }}>{card.text}</span>
                    <span style={{ fontSize: 8, color: "#64748B", marginLeft: 2, flexShrink: 0, transform: isE ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                  </div>
                  {placed && <span style={{ display: "block", fontSize: 8, color: "#EF4444", marginTop: 2, paddingLeft: 14 }}>→「{TL[res.cr[card.id].pt]}」に配置</span>}
                </div>
                {isE && card?.reason && <div style={{ padding: "7px 9px 7px 12px", marginTop: 1, backgroundColor: "#334155", borderRadius: "0 0 6px 6px", borderLeft: "3px solid #475569" }}><p style={{ fontSize: 9, lineHeight: 1.7, color: "#94A3B8", margin: 0 }}><strong style={{ color: "#CBD5E1" }}>なぜノイズか：</strong>{card.reason}</p></div>}
              </div>);
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button style={S.pb} onClick={startGame}>次の問題</button>
          <button style={S.sb} onClick={() => setScr("stats")}>📈</button>
          <button style={S.sb} onClick={() => { setMode(null); setScr("start"); }}>🏠</button>
        </div>
        <div style={{ height: 16 }} />
      </div></div>
    );
  }

  // ── PLAY ──
  const tp = timer / TT; const tc = timer <= 15 ? "#EF4444" : timer <= 30 ? "#F59E0B" : "#22C55E";
  const isAI = q?.id?.toString().startsWith("ai");
  return (
    <div style={S.c}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, height: 30, backgroundColor: "#1E293B", display: "flex", alignItems: "center", padding: "0 10px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", opacity: 0.15, width: `${tp * 100}%`, backgroundColor: tc, transition: "width 1s linear" }} />
        {isAI && <span style={{ fontSize: 9, color: "#8B5CF6", zIndex: 1, fontWeight: 700 }}>🤖 AI</span>}
        <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#E2E8F0", zIndex: 1, marginLeft: "auto" }}>{timer}s</span>
      </div>
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #1E293B" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#F59E0B", margin: "0 0 2px" }}>{q.title}</p>
        <p style={{ fontSize: 11, lineHeight: 1.5, color: "#94A3B8", margin: "0 0 6px" }}>{q.situation || q.prompt}</p>
        {q.issue && <p style={{ fontSize: 13, lineHeight: 1.6, color: "#E2E8F0", margin: 0, fontWeight: 600, padding: "6px 8px", backgroundColor: "#1E293B", borderRadius: 6, borderLeft: "2px solid #F59E0B" }}>💡 {q.issue}</p>}
      </div>
      <div style={{ padding: "8px 5px 0" }}>
        {[0, 1, 2].map((tier) => (
          <div key={tier} style={{ marginBottom: 5 }}>
            <div style={{ marginBottom: 2, paddingLeft: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, padding: "1px 5px", borderRadius: 3, backgroundColor: TC[tier] + "22", color: TC[tier] }}>{TL[tier]}</span>
              {TS[tier] > 1 && <span style={{ fontSize: 7, color: "#475569" }}>← 優先順位順 →</span>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: TS[tier] }).map((_, i) => {
                const sid = `t${tier}-${i}`; const card = gc(sid); const empty = !card;
                const pl = TS[tier] > 1 ? ["左", "中", "右"][i] : "";
                return (
                  <div key={sid} onClick={() => onS(sid)} style={{ flex: 1, minHeight: 46, borderRadius: 6, padding: "5px 6px", display: "flex", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: empty ? "dashed" : "solid", borderColor: TC[tier] + "44", backgroundColor: empty ? "#1E293B44" : "#1E293B", cursor: sel && empty ? "pointer" : "default", animation: shk === sid ? "shake .4s" : pop === sid ? "pop .3s" : "none" }}>
                    {card ? <span style={{ fontSize: 9, lineHeight: 1.4, color: "#E2E8F0" }}>{card.text}</span>
                      : <span style={{ fontSize: 9, color: "#475569" }}>{sel ? `▼ ${pl}` : `${TL[tier]}${pl ? `(${pl})` : ""}`}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "6px 12px 3px" }}><span style={{ fontSize: 9, fontWeight: 600, color: "#64748B", letterSpacing: 1 }}>カード（{cards.length - fc}枚）</span></div>
      <div style={{ padding: "0 5px", display: "flex", flexDirection: "column", gap: 3 }}>
        {cards.map((card) => { if (ip(card.id)) return null; const is = sel === card.id; return (
          <div key={card.id} onClick={() => onC(card.id)} style={{ padding: "8px 10px", backgroundColor: is ? "#F59E0B11" : "#1E293B", borderRadius: 6, border: `1.5px solid ${is ? "#F59E0B" : "#334155"}`, cursor: "pointer", position: "relative", ...(is ? { boxShadow: "0 0 0 1px #F59E0B44" } : {}) }}>
            <span style={{ fontSize: 11, lineHeight: 1.5, color: "#CBD5E1" }}>{card.text}</span>
            {is && <span style={{ position: "absolute", top: -6, right: 6, fontSize: 8, fontWeight: 700, color: "#0F172A", backgroundColor: "#F59E0B", padding: "1px 5px", borderRadius: 3 }}>選択中</span>}
          </div>);
        })}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 10px", backgroundColor: "#0F172Aee", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", zIndex: 10 }}>
        <button style={{ width: "100%", maxWidth: 480, padding: "10px", fontSize: 13, fontWeight: 700, color: "#0F172A", background: "linear-gradient(135deg,#3B82F6,#6366F1)", border: "none", borderRadius: 6, cursor: "pointer", opacity: fc === 0 ? 0.4 : 1 }} onClick={submit} disabled={fc === 0}>提出（{fc}/6）</button>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}@keyframes pop{0%{transform:scale(.9);opacity:.5}50%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

const S = {
  c: { minHeight: "100vh", backgroundColor: "#0F172A", color: "#E2E8F0", fontFamily: "'Noto Sans JP','Helvetica Neue',sans-serif", maxWidth: 480, margin: "0 auto", padding: "0 0 80px 0", position: "relative", overflowX: "hidden" },
  ss: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "32px 18px" },
  ti: { fontSize: 26, fontWeight: 800, letterSpacing: 6, margin: 0, background: "linear-gradient(135deg,#F59E0B,#3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  mc: { padding: "14px 16px", backgroundColor: "#1E293B", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" },
  pb: { padding: "10px 26px", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#0F172A", background: "linear-gradient(135deg,#F59E0B,#FBBF24)", border: "none", borderRadius: 6, cursor: "pointer" },
  sb: { padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#94A3B8", background: "none", border: "1px solid #334155", borderRadius: 6, cursor: "pointer" },
  nb: { padding: "12px", backgroundColor: "#1E293B", borderRadius: 8, borderLeft: "3px solid" },
  nt: { fontSize: 12, fontWeight: 700, color: "#E2E8F0", margin: "0 0 8px" },
  back: { background: "none", border: "1px solid #334155", color: "#94A3B8", borderRadius: 5, padding: "4px 10px", fontSize: 10, cursor: "pointer" },
};
