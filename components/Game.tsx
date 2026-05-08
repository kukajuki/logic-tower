"use client";

import { useCallback, useEffect, useState } from "react";
import StartScreen from "@/components/StartScreen";
import PlayPhase1 from "@/components/PlayPhase1";
import ResultPhase1 from "@/components/ResultPhase1";
import StatsScreen from "@/components/StatsScreen";
import { Level, getQuestionsByLevel } from "@/lib/questions";
import { HistoryEntry, Question, Slots } from "@/lib/types";
import { Phase1Result, scorePhase1 } from "@/lib/scoring";
import {
  appendHistory,
  loadHistory,
  loadUsedForLevel,
  nowDateTime,
  saveUsedForLevel,
} from "@/lib/storage";

type Screen = "start" | "play" | "result" | "stats";

export default function Game() {
  const [screen, setScreen] = useState<Screen>("start");
  const [level, setLevel] = useState<Level | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [submission, setSubmission] = useState<{
    slots: Slots;
    result: Phase1Result;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const startLevel = useCallback((lv: Level) => {
    const all = getQuestionsByLevel(lv);
    if (all.length === 0) return;
    const used = loadUsedForLevel(lv);
    let pool = all.filter((q) => !used.includes(q.id));
    let nextUsed = used;
    if (pool.length === 0) {
      pool = all;
      nextUsed = [];
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const updatedUsed = [...nextUsed, picked.id];
    saveUsedForLevel(lv, updatedUsed);
    setQuestion(picked);
    setSubmission(null);
    setScreen("play");
  }, []);

  const onStart = useCallback(() => {
    if (level !== null) startLevel(level);
  }, [level, startLevel]);

  const onSubmit = useCallback(
    (slots: Slots, timeLeft: number) => {
      if (!question || level === null) return;
      const result = scorePhase1(question.phase1, slots, timeLeft);
      const { date, time } = nowDateTime();
      const entry: HistoryEntry = {
        date,
        time,
        questionId: question.id,
        questionTitle: question.title,
        level,
        isBasic: level === 1,
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
    [question, level]
  );

  const onNext = useCallback(() => {
    if (level !== null) startLevel(level);
    else setScreen("start");
  }, [level, startLevel]);

  const onHome = useCallback(() => {
    setLevel(null);
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
      level={level}
      onSelectLevel={setLevel}
      onStart={onStart}
      onOpenStats={() => setScreen("stats")}
      totalPlays={history.length}
    />
  );
}
