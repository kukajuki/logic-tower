import { Phase1Data, Slots } from "./types";
import { TIER_LABELS } from "./constants";

export type NarrativeKind = "o" | "s" | "p" | "x";

export interface NarrativePart {
  kind: NarrativeKind;
  message: string;
}

export function buildNarrative(phase1: Phase1Data, slots: Slots): NarrativePart[] {
  const get = (sid: string) => {
    const cid = slots[sid];
    return cid ? phase1.cards.find((c) => c.id === cid) ?? null : null;
  };

  const conclusion = get("t0-0");
  const argLeft = get("t1-0");
  const argRight = get("t1-1");
  const evLeft = get("t2-0");
  const evMid = get("t2-1");
  const evRight = get("t2-2");

  const parts: NarrativePart[] = [];

  if (!conclusion) {
    parts.push({ kind: "x", message: "結論が未配置。聞き手は「結局どうすべき？」がわかりません。" });
  } else if (conclusion.type === "distractor") {
    parts.push({
      kind: "x",
      message: `結論にノイズ「${conclusion.phrase}」が配置されています。方向性が見えません。`,
    });
  } else if (conclusion.tier !== 0) {
    const lbl = TIER_LABELS[conclusion.tier >= 0 ? conclusion.tier : 2];
    parts.push({
      kind: "x",
      message: `結論に「${conclusion.phrase}」を配置。これは${lbl}レベルの情報で、結論としては${
        conclusion.tier === 1 ? "抽象的すぎ" : "具体的すぎ"
      }ます。`,
    });
  } else {
    parts.push({
      kind: "o",
      message: `結論「${conclusion.phrase}」——正しく配置されています。`,
    });
  }

  if (argLeft && argRight) {
    const correctArgIds = new Set([
      phase1.correctSlots["t1-0"],
      phase1.correctSlots["t1-1"],
    ]);
    const swapped =
      argLeft.id === phase1.correctSlots["t1-1"] && argRight.id === phase1.correctSlots["t1-0"];
    if (swapped) {
      parts.push({
        kind: "s",
        message: `論点カードは正しいですが左右が逆。あなたの構造だと「まず${argLeft.phrase}、次に${argRight.phrase}」と読めます。`,
      });
    } else if (
      argLeft.id === phase1.correctSlots["t1-0"] &&
      argRight.id === phase1.correctSlots["t1-1"]
    ) {
      parts.push({
        kind: "o",
        message: `論点「${argLeft.phrase}」→「${argRight.phrase}」の順序も正解。自然な流れです。`,
      });
    } else {
      const issues: string[] = [];
      if (argLeft.tier !== 1) {
        issues.push(
          `左の論点に${argLeft.tier === -1 ? "ノイズ" : TIER_LABELS[argLeft.tier]}「${argLeft.phrase}」`
        );
      }
      if (argRight.tier !== 1) {
        issues.push(
          `右の論点に${argRight.tier === -1 ? "ノイズ" : TIER_LABELS[argRight.tier]}「${argRight.phrase}」`
        );
      }
      if (issues.length) {
        parts.push({
          kind: "x",
          message:
            issues.join("、") + "が配置されています。論点層には「結論を支える判断軸」を置きます。",
        });
      } else {
        // どちらも tier=1 だが正解スロットの組み合わせと違う = c7（核心でないサブイシュー）が混入
        const offCore = [argLeft, argRight].filter((c) => !correctArgIds.has(c.id));
        if (offCore.length) {
          parts.push({
            kind: "p",
            message: `「${offCore[0].phrase}」は関連しますが、このイシューの核心サブイシューではありません。論点層は「結論を直接支える問い」だけに絞ります。`,
          });
        } else {
          parts.push({
            kind: "p",
            message: `論点は正しい層ですが配置が異なります。「${argLeft.phrase}」→「${argRight.phrase}」と読めます。`,
          });
        }
      }
    }
  } else {
    const which = !argLeft && !argRight ? "両方" : !argLeft ? "左" : "右";
    parts.push({ kind: "x", message: `論点の${which}が未配置。判断の軸が欠けています。` });
  }

  const evidences = [evLeft, evMid, evRight].filter(Boolean) as NonNullable<
    typeof evLeft
  >[];
  const evOk = evidences.filter((c) => c.tier === 2).length;
  const evDist = evidences.filter((c) => c.type === "distractor").length;

  if (!evidences.length) {
    parts.push({ kind: "x", message: "根拠が未配置。データなしでは主張が空論です。" });
  } else if (evOk === 3 && !evDist) {
    const t20Exact = evLeft?.id === phase1.correctSlots["t2-0"];
    const t21Exact = evMid?.id === phase1.correctSlots["t2-1"];
    const t22Exact = evRight?.id === phase1.correctSlots["t2-2"];
    const allExact = t20Exact && t21Exact && t22Exact;
    const midRightSwap =
      t20Exact &&
      evMid?.id === phase1.correctSlots["t2-2"] &&
      evRight?.id === phase1.correctSlots["t2-1"];
    if (allExact) {
      parts.push({ kind: "o", message: "根拠3枚の選択と順序も完璧です。" });
    } else if (midRightSwap) {
      parts.push({
        kind: "o",
        message:
          "根拠の中央と右が入れ替わっていますが、補強と反証は対等なので両方正解として扱います。",
      });
    } else {
      parts.push({
        kind: "p",
        message:
          "根拠3枚は正しいですが順序が異なります。左から重要度順に並べるとスムーズです。",
      });
    }
  } else {
    const msgs: string[] = [];
    if (evDist) msgs.push(`${evDist}枚のノイズが根拠に混入`);
    const wrongTier = evidences.filter((c) => c.tier !== 2 && c.tier !== -1);
    if (wrongTier.length) {
      msgs.push(`「${wrongTier[0].phrase}」は根拠ではなく${TIER_LABELS[wrongTier[0].tier]}レベル`);
    }
    parts.push({ kind: "x", message: msgs.join("。") + "。" });
  }

  return parts;
}

export function userReading(phase1: Phase1Data, slots: Slots): string | null {
  const get = (sid: string) => {
    const cid = slots[sid];
    return cid ? phase1.cards.find((c) => c.id === cid) ?? null : null;
  };
  const cc = get("t0-0");
  const al = get("t1-0");
  const ar = get("t1-1");
  if (!cc || !al || !ar || cc.type === "distractor") return null;
  return `「${cc.phrase}」——なぜか？ まず「${al.phrase}」。次に「${ar.phrase}」。`;
}
