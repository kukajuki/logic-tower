"use client";

import { Card, Slots } from "@/lib/types";
import { POSITION_LABELS, TIER_COLORS, TIER_LABELS, TIER_SLOTS } from "@/lib/constants";

interface PyramidViewProps {
  cards: Card[];
  slots: Slots;
  selectedCardId?: string | null;
  onSlotClick?: (slotId: string) => void;
  shakeSlot?: string | null;
  popSlot?: string | null;
  readOnly?: boolean;
}

export default function PyramidView({
  cards,
  slots,
  selectedCardId,
  onSlotClick,
  shakeSlot,
  popSlot,
  readOnly = false,
}: PyramidViewProps) {
  const cardOf = (sid: string): Card | null => {
    const cid = slots[sid];
    return cid ? cards.find((c) => c.id === cid) ?? null : null;
  };

  return (
    <div style={{ padding: "8px 5px 0" }}>
      {[0, 1, 2].map((tier) => (
        <div key={tier} style={{ marginBottom: 5 }}>
          <div
            style={{
              marginBottom: 2,
              paddingLeft: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 2,
                padding: "1px 5px",
                borderRadius: 3,
                backgroundColor: TIER_COLORS[tier] + "22",
                color: TIER_COLORS[tier],
              }}
            >
              {TIER_LABELS[tier]}
            </span>
            {TIER_SLOTS[tier] > 1 && (
              <span style={{ fontSize: 7, color: "#475569" }}>← 優先順位順 →</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: TIER_SLOTS[tier] }).map((_, i) => {
              const sid = `t${tier}-${i}`;
              const card = cardOf(sid);
              const empty = !card;
              const posLabel = TIER_SLOTS[tier] > 1 ? POSITION_LABELS[i] : "";
              const animation =
                shakeSlot === sid
                  ? "shake .4s"
                  : popSlot === sid
                  ? "pop .3s"
                  : "none";
              return (
                <div
                  key={sid}
                  onClick={() => !readOnly && onSlotClick?.(sid)}
                  style={{
                    flex: 1,
                    minHeight: 46,
                    borderRadius: 6,
                    padding: "5px 6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderStyle: empty ? "dashed" : "solid",
                    borderColor: TIER_COLORS[tier] + "44",
                    backgroundColor: empty ? "#1E293B44" : "#1E293B",
                    cursor: !readOnly && selectedCardId && empty ? "pointer" : "default",
                    animation,
                  }}
                >
                  {card ? (
                    <span style={{ fontSize: 9, lineHeight: 1.4, color: "#E2E8F0" }}>
                      {card.text}
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: "#475569" }}>
                      {selectedCardId
                        ? `▼ ${posLabel}`
                        : `${TIER_LABELS[tier]}${posLabel ? `(${posLabel})` : ""}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
