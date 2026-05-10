import { ArgumentPattern } from "./types";

/**
 * The 12 canonical sub-issue patterns. Each pattern fixes the framing of:
 * - c5 (論点・左, t1-0)  = the "Why / value / forward" sub-issue
 * - c3 (論点・右, t1-1)  = the "How / risk / guard" sub-issue
 * - c7 (論点・3枚目)     = related but not core (always; pattern-independent)
 *
 * The phrasing slots below are guidelines for the question authors; concrete
 * sub-issue text per question should fit the slot semantics, e.g. the
 * "新規参入・拡大型" left slot should be a question about market opportunity,
 * not implementation.
 */
export interface ArgumentPatternSpec {
  /** Pattern key, matches Question.pattern. */
  key: ArgumentPattern;
  /** Phrasing for c5 (t1-0). */
  leftSlot: string;
  /** Phrasing for c3 (t1-1). */
  rightSlot: string;
  /** Short description / typical examples. */
  description: string;
  /** Example issues for which this pattern is the natural fit. */
  examples: string[];
}

export const ARGUMENT_PATTERNS: Record<ArgumentPattern, ArgumentPatternSpec> = {
  "新規参入・拡大型": {
    key: "新規参入・拡大型",
    leftSlot: "市場・需要はあるか？",
    rightSlot: "自社で実現できるか？",
    description: "新領域に踏み出すか否かの判断。市場機会と実現性のバランス。",
    examples: ["海外進出", "新事業参入", "新市場の取り込み"],
  },
  "危機対応型": {
    key: "危機対応型",
    leftSlot: "やらないとどうなるか？",
    rightSlot: "やるならどう対処するか？",
    description: "やらないと損失が出るタイプの判断。緊急性と対処設計のバランス。",
    examples: ["値上げ", "事業継続の危機対応", "急場の縮小"],
  },
  "投資判断型": {
    key: "投資判断型",
    leftSlot: "ROI・価値は高いか？",
    rightSlot: "コスト・リスクは許容できるか？",
    description: "投資の是非判断。価値と投下コストのバランス。",
    examples: ["AI導入", "設備投資", "システム刷新"],
  },
  "制度変更型": {
    key: "制度変更型",
    leftSlot: "なぜ変える必要があるか？",
    rightSlot: "どう変えれば受け入れられるか？",
    description: "社内制度や仕組みの変更判断。必要性と受容性のバランス。",
    examples: ["人事制度の改定", "働き方の変更", "評価制度の刷新"],
  },
  "優先順位型": {
    key: "優先順位型",
    leftSlot: "最も重要な判断軸は何か？",
    rightSlot: "次に重要な判断軸は何か？",
    description: "複数領域の優先順位付け。判断軸を直列で並べる。",
    examples: ["DX領域の選択", "採用方針の決定", "重点市場の選択"],
  },
  "チャネル転換型": {
    key: "チャネル転換型",
    leftSlot: "新チャネルの優位性はあるか？",
    rightSlot: "既存チャネルへの影響は許容できるか？",
    description: "販売・流通チャネルの転換。新チャネルの魅力と既存影響のバランス。",
    examples: ["D2C転換", "直販EC", "販路変更"],
  },
  "組織変革型": {
    key: "組織変革型",
    leftSlot: "変革の必要性は高いか？",
    rightSlot: "組織が変革を受け入れられるか？",
    description: "組織構造・働き方の変革。必要性と組織受容性のバランス。",
    examples: ["週休3日", "リモート移行", "組織再編"],
  },
  "テクノロジー導入型": {
    key: "テクノロジー導入型",
    leftSlot: "技術で課題は解決できるか？",
    rightSlot: "人・組織は対応できるか？",
    description: "新技術の導入判断。技術の効果と組織の受け入れのバランス。",
    examples: ["AI・ロボット導入", "新システム導入"],
  },
  "撤退・縮小型": {
    key: "撤退・縮小型",
    leftSlot: "撤退しないとどんな損失が出るか？",
    rightSlot: "撤退することで失うものは何か？",
    description: "撤退・縮小判断。継続のコストと撤退のコストのバランス。",
    examples: ["事業撤退", "店舗閉鎖", "ライン縮小"],
  },
  "アライアンス型": {
    key: "アライアンス型",
    leftSlot: "相手と組む価値はあるか？",
    rightSlot: "自社のリスクは管理できるか？",
    description: "提携・M&Aなど他社との連携判断。連携価値と自社リスクのバランス。",
    examples: ["合弁設立", "業務提携", "M&A"],
  },
  "価格変更型": {
    key: "価格変更型",
    leftSlot: "変更しないと財務的に成立するか？",
    rightSlot: "変更しても顧客は離れないか？",
    description: "価格・料金体系の変更判断。財務必要性と顧客離反のバランス。",
    examples: ["値上げ", "値下げ", "料金体系の刷新"],
  },
  "市場開拓型": {
    key: "市場開拓型",
    leftSlot: "市場に十分な機会があるか？",
    rightSlot: "自社固有の勝ち筋があるか？",
    description: "市場開拓・ニッチ参入の判断。市場機会と自社の独自勝ち筋のバランス。",
    examples: ["新市場開拓", "ニッチ参入"],
  },
};

export const ARGUMENT_PATTERN_LIST: ArgumentPatternSpec[] =
  Object.values(ARGUMENT_PATTERNS);
