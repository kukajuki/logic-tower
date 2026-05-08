"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Timer from "./Timer";
import PyramidView from "./PyramidView";
import { S } from "@/lib/styles";
import { PHASE1_TIME } from "@/lib/constants";
import { Card, Question, Slots } from "@/lib/types";

interface PlayPhase1Props {
  question: Question;
  onSubmit: (slots: Slots, timeLeft: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function PlayPhase1({ question, onSubmit }: PlayPhase1Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [slots, setSlots] = useState<Slots>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(PHASE1_TIME);
  const [shake, setShake] = useState<string | null>(null);
  const [pop, setPop] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCards(shuffle(question.phase1.cards));
    setSlots({});
    setSelected(null);
    setTimer(PHASE1_TIME);
    submittedRef.current = false;
  }, [question.id, question.phase1.cards]);

  const placedSet = useMemo(() => new Set(Object.values(slots)), [slots]);
  const filled = Object.keys(slots).length;

  const submit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    onSubmit(slots, timer);
  };

  useEffect(() => {
    if (submittedRef.current) return;
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  const onCardTap = (cid: string) => {
    if (placedSet.has(cid)) {
      const sid = Object.keys(slots).find((k) => slots[k] === cid);
      if (sid) {
        setSlots((p) => {
          const n = { ...p };
          delete n[sid];
          return n;
        });
      }
      setSelected(null);
    } else {
      setSelected((prev) => (prev === cid ? null : cid));
    }
  };

  const onSlotTap = (sid: string) => {
    if (slots[sid]) {
      const cid = slots[sid];
      setSlots((p) => {
        const n = { ...p };
        delete n[sid];
        return n;
      });
      setSelected(cid);
      return;
    }
    if (!selected) {
      setShake(sid);
      setTimeout(() => setShake(null), 500);
      return;
    }
    setSlots((p) => ({ ...p, [sid]: selected }));
    setPop(sid);
    setTimeout(() => setPop(null), 400);
    setSelected(null);
  };

  return (
    <div style={S.container}>
      <Timer remaining={timer} total={PHASE1_TIME} />

      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #1E293B" }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#F59E0B",
            margin: "0 0 2px",
          }}
        >
          {question.title}
        </p>
        <p
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            color: "#94A3B8",
            margin: "0 0 6px",
          }}
        >
          {question.situation}
        </p>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#E2E8F0",
            margin: 0,
            fontWeight: 600,
            padding: "6px 8px",
            backgroundColor: "#1E293B",
            borderRadius: 6,
            borderLeft: "2px solid #F59E0B",
          }}
        >
          💡 {question.issue}
        </p>
      </div>

      <PyramidView
        cards={question.phase1.cards}
        slots={slots}
        selectedCardId={selected}
        onSlotClick={onSlotTap}
        shakeSlot={shake}
        popSlot={pop}
      />

      <div style={{ padding: "6px 12px 3px" }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "#64748B",
            letterSpacing: 1,
          }}
        >
          カード（{cards.length - filled}枚）
        </span>
      </div>
      <div style={{ padding: "0 5px", display: "flex", flexDirection: "column", gap: 3 }}>
        {cards.map((card) => {
          if (placedSet.has(card.id)) return null;
          const isSelected = selected === card.id;
          return (
            <div
              key={card.id}
              onClick={() => onCardTap(card.id)}
              style={{
                padding: "8px 10px",
                backgroundColor: isSelected ? "#F59E0B11" : "#1E293B",
                borderRadius: 6,
                border: `1.5px solid ${isSelected ? "#F59E0B" : "#334155"}`,
                cursor: "pointer",
                position: "relative",
                ...(isSelected ? { boxShadow: "0 0 0 1px #F59E0B44" } : {}),
              }}
            >
              <span style={{ fontSize: 11, lineHeight: 1.5, color: "#CBD5E1" }}>{card.text}</span>
              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: 6,
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#0F172A",
                    backgroundColor: "#F59E0B",
                    padding: "1px 5px",
                    borderRadius: 3,
                  }}
                >
                  選択中
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 10px",
          backgroundColor: "#0F172Aee",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <button
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "10px",
            fontSize: 13,
            fontWeight: 700,
            color: "#0F172A",
            background: "linear-gradient(135deg,#3B82F6,#6366F1)",
            border: "none",
            borderRadius: 6,
            cursor: filled === 0 ? "default" : "pointer",
            opacity: filled === 0 ? 0.4 : 1,
          }}
          onClick={submit}
          disabled={filled === 0}
        >
          提出（{filled}/6）
        </button>
      </div>
    </div>
  );
}
