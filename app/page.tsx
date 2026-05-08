"use client";

import { useCallback, useEffect, useState } from "react";
import StartScreen, { Mode } from "@/components/StartScreen";
import PlayPhase1 from "@/components/PlayPhase1";
import ResultPhase1 from "@/components/ResultPhase1";
import StatsScreen from "@/components/StatsScreen";
import { BASIC_QUESTIONS } from "@/lib/questions-basic";
import { HistoryEntry, Question, Slots } from "@/lib/types";
import { Phase1Result, scorePhase1 } from "@/lib/scoring";
import {
  appendHistory,
  loadHistory,
  loadUsedBasic,
  nowDateTime,
  saveUsedBasic,
} from "@/lib/storage";

type Screen = "start" | "play" | "result" | "stats";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("start");
  const [mode, setMode] = useState<Mode | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [submission, setSubmission] = useState<{
    slots: Slots;
    result: Phase1Result;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [usedBasic, setUsedBasic] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    setUsedBasic(loadUsedBasic());
  }, []);

  const startBasic = useCallback(() => {
    let pool = BASIC_QUESTIONS.filter((q) => !usedBasic.includes(q.id));
    let nextUsed = usedBasic;
    if (pool.length === 0) {
      pool = BASIC_QUESTIONS;
      nextUsed = [];
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const updatedUsed = [...nextUsed, picked.id];
    setUsedBasic(updatedUsed);
    saveUsedBasic(updatedUsed);
    setQuestion(picked);
    setSubmission(null);
    setScreen("play");
  }, [usedBasic]);

  const onStart = useCallback(() => {
    if (mode === "basic") startBasic();
  }, [mode, startBasic]);

  const onSubmit = useCallback(
    (slots: Slots, timeLeft: number) => {
      if (!question) return;
      const result = scorePhase1(question.phase1, slots, timeLeft);
      const { date, time } = nowDateTime();
      const entry: HistoryEntry = {
        date,
        time,
        questionId: question.id,
        questionTitle: question.title,
        isBasic: question.id.startsWith("f"),
        scores: {
          phase1: {
            score: result.score,
            accuracy: result.accuracy,
            tierScores: result.tierScores,
            timeLeft: result.timeLeft,
          },
          total: result.score,
        },
      };
      const updated = appendHistory(entry);
      setHistory(updated);
      setSubmission({ slots, result });
      setScreen("result");
    },
    [question]
  );

  const onNext = useCallback(() => {
    if (mode === "basic") startBasic();
    else setScreen("start");
  }, [mode, startBasic]);

  const onHome = useCallback(() => {
    setMode(null);
    setQuestion(null);
    setSubmission(null);
    setScreen("start");
  }, []);

  if (screen === "stats") {
    return <StatsScreen history={history} onBack={() => setScreen("start")} />;
  }

  if (screen === "play" && question) {
    return <PlayPhase1 question={question} onSubmit={onSubmit} />;
  }

  if (screen === "result" && question && submission) {
    return (
      <ResultPhase1
        question={question}
        slots={submission.slots}
        result={submission.result}
        onNext={onNext}
        onOpenStats={() => setScreen("stats")}
        onHome={onHome}
      />
    );
  }

  return (
    <StartScreen
      mode={mode}
      onSelectMode={setMode}
      onStart={onStart}
      onOpenStats={() => setScreen("stats")}
      totalPlays={history.length}
    />
  );
}
