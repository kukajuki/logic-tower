import { HistoryEntry } from "./types";
import { Level } from "./questions";

const HISTORY_KEY = "logic-tower-history";
const USED_KEY = "logic-tower-used";
const MAX_HISTORY = 200;

type UsedByLevel = Partial<Record<Level, string[]>>;

function safeRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota errors */
  }
}

export function loadHistory(): HistoryEntry[] {
  const raw = safeRead(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  const trimmed = entries.slice(-MAX_HISTORY);
  safeWrite(HISTORY_KEY, JSON.stringify(trimmed));
}

export function appendHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [...loadHistory(), entry].slice(-MAX_HISTORY);
  saveHistory(next);
  return next;
}

export function loadUsed(): UsedByLevel {
  const raw = safeRead(USED_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as UsedByLevel) : {};
  } catch {
    return {};
  }
}

export function saveUsed(used: UsedByLevel) {
  safeWrite(USED_KEY, JSON.stringify(used));
}

export function loadUsedForLevel(level: Level): string[] {
  return loadUsed()[level] ?? [];
}

export function saveUsedForLevel(level: Level, ids: string[]) {
  const current = loadUsed();
  current[level] = ids;
  saveUsed(current);
}

export function nowDateTime(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  };
}
