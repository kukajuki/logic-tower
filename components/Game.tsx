"use client";

import { useCallback, useEffect, useState } from "react";
import StartScreen from "@/components/StartScreen";
import PlayPhase1 from "@/components/PlayPhase1";
import ResultPhase1 from "@/components/ResultPhase1";
import StatsScreen from "@/components/StatsScreen";
import IssueSelection from "@/components/IssueSelection";
import SubIssueSelection from "@/components/SubIssueSelection";
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

type Screen =
  | "start"
  | "issue-select"
  | "subissue-select"
  | "play"
  | "result"
  | "stats";

// Lv.3 hides all argument cards from the play-screen pool — they're either
// auto-placed (the 2 picked sub-issues) or filtered out (the unselected one).
const LV3_HIDDEN_CARD_IDS = ["c5", "c3", "c7"];

interface PlayContext {
  initialLocks?: Slots;
  hiddenCardIds?: string[];
  /** Tracks whether the player picked the correct issue (Lv.2 / Lv.3). */
  issueCorrect?: boolean;
  /** For Lv.3: number of sub-issue picks that match c5/c3 (0..2). */
  subIssueCorrect?: number;
}

export default function Game() {
  const [screen, setScreen] = useState<Screen>("start");
  const [level, setLevel] = useState<Level | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [playContext, setPlayContext] = useState<PlayContext>({});
  const [submission, setSubmission] = useState<{
    slots: Slots;
    result: Phase1Result;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const pickRandomQuestion = useCallback((lv: Level): Question | null => {
    const all = getQuestionsByLevel(lv);
    if (all.length === 0) return null;
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
    return picked;
  }, []);

  const startLevel = useCallback(
    (lv: Level) => {
      const picked = pickRandomQuestion(lv);
      if (!picked) return;
      setQuestion(picked);
      setSubmission(null);
      setPlayContext({});
      // Routing branch by level:
      //   Lv.1 → straight to play
      //   Lv.2 → issue selection → play
      //   Lv.3 → issue selection → sub-issue selection → play
      if (lv === 1 || !picked.issueSelection) {
        setScreen("play");
      } else {
        setScreen("issue-select");
      }
    },
    [pickRandomQuestion],
  );

  const onStart = useCallback(() => {
    if (level !== null) startLevel(level);
  }, [level, startLevel]);

  const onIssuePicked = useCallback(
    (_chosenIssue: string, isCorrect: boolean) => {
      if (!question || level === null) return;
      if (level === 3 && question.subIssueSelection) {
        setPlayContext((p) => ({ ...p, issueCorrect: isCorrect }));
        setScreen("subissue-select");
      } else {
        // Lv.2 → straight to play, no card locks
        setPlayContext({ issueCorrect: isCorrect });
        setScreen("play");
      }
    },
    [question, level],
  );

  const onSubIssuePicked = useCallback(
    (chosenTexts: string[]) => {
      if (!question) return;
      const cards = question.phase1.cards;
      const correctSlots = question.phase1.correctSlots;
      const c5Id = correctSlots["t1-0"];
      const c3Id = correctSlots["t1-1"];
      const candidates = question.subIssueSelection?.candidates ?? [];
      // The two candidates with isCorrect=true map to c5 (1st) and c3 (2nd) in
      // source order. Match by index here rather than text — the candidate
      // wording can differ from the card text after pattern-aligned refactors.
      const correctTexts = candidates.filter((c) => c.isCorrect).map((c) => c.text);
      const c5Text = correctTexts[0];
      const c3Text = correctTexts[1];

      const initialLocks: Slots = {};
      let subCorrect = 0;
      for (const text of chosenTexts) {
        if (text === c5Text) {
          initialLocks["t1-0"] = c5Id;
          subCorrect++;
        } else if (text === c3Text) {
          initialLocks["t1-1"] = c3Id;
          subCorrect++;
        } else {
          // Trap pick. Fall back to a text-match against actual cards (catches
          // the c7 candidate, whose text mirrors c7's card text).
          const matched = cards.find((c) => c.text === text);
          if (!matched) continue;
          if (!initialLocks["t1-0"]) initialLocks["t1-0"] = matched.id;
          else if (!initialLocks["t1-1"]) initialLocks["t1-1"] = matched.id;
        }
      }

      setPlayContext((p) => ({
        ...p,
        initialLocks,
        hiddenCardIds: LV3_HIDDEN_CARD_IDS,
        subIssueCorrect: subCorrect,
      }));
      setScreen("play");
    },
    [question],
  );

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
        scores: {
          phase1: {
            score: result.score,
            accuracy: result.accuracy,
            tierScores: result.tierScores,
            timeLeft: result.timeLeft,
          },
          ...(playContext.issueCorrect !== undefined
            ? { issueCorrect: playContext.issueCorrect }
            : {}),
          ...(playContext.subIssueCorrect !== undefined
            ? { subIssueCorrect: playContext.subIssueCorrect }
            : {}),
          total: result.score,
        },
      };
      const updated = appendHistory(entry);
      setHistory(updated);
      setSubmission({ slots, result });
      setScreen("result");
    },
    [question, level, playContext],
  );

  const onNext = useCallback(() => {
    if (level !== null) startLevel(level);
    else setScreen("start");
  }, [level, startLevel]);

  const onHome = useCallback(() => {
    setLevel(null);
    setQuestion(null);
    setSubmission(null);
    setPlayContext({});
    setScreen("start");
  }, []);

  if (screen === "stats") {
    return <StatsScreen history={history} onBack={() => setScreen("start")} />;
  }

  if (screen === "issue-select" && question) {
    return (
      <IssueSelection
        question={question}
        onPick={onIssuePicked}
        onBack={onHome}
      />
    );
  }

  if (screen === "subissue-select" && question) {
    return (
      <SubIssueSelection
        question={question}
        chosenIssue={question.issue}
        onPick={onSubIssuePicked}
        onBack={() => setScreen("issue-select")}
      />
    );
  }

  if (screen === "play" && question) {
    return (
      <PlayPhase1
        question={question}
        onSubmit={onSubmit}
        initialLocks={playContext.initialLocks}
        hiddenCardIds={playContext.hiddenCardIds}
      />
    );
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
