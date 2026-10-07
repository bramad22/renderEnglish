import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ExerciseSummary } from "../api/types";
import { readJSON, todayKey, writeJSON } from "../lib/utils";

/**
 * All learner progress lives in localStorage under one key. No account, no server.
 * Bump the key version if the shape changes in an incompatible way.
 */
const STORAGE_KEY = "mt-progress-v1";

export interface ExerciseProgress {
  section: string;
  completed: boolean;
  lastScore?: number; // 0..1
  bestScore?: number; // 0..1
  attempts: number;
  updatedAt: string;
}

export interface ExamRecord {
  at: string;
  exerciseId: string;
  title: string;
  ratings: Record<string, number>;
  reflection: string;
}

export interface ProgressState {
  exercises: Record<string, ExerciseProgress>;
  lastVisited: { id: string; section: string; title: string; at: string } | null;
  activeDays: string[]; // YYYY-MM-DD, sorted
  quizBest: Record<string, number>; // points
  notes: Record<string, string>;
  assessments: Record<string, Record<string, number>>;
  examHistory: ExamRecord[];
}

const EMPTY: ProgressState = {
  exercises: {},
  lastVisited: null,
  activeDays: [],
  quizBest: {},
  notes: {},
  assessments: {},
  examHistory: [],
};

interface ProgressApi {
  state: ProgressState;
  recordResult: (ex: { id: string; section: string }, score: number | null) => void;
  markVisited: (ex: Pick<ExerciseSummary, "id" | "section" | "title">) => void;
  setNote: (id: string, text: string) => void;
  saveAssessment: (id: string, ratings: Record<string, number>) => void;
  saveQuizScore: (id: string, points: number) => boolean;
  addExamRecord: (rec: ExamRecord) => void;
  reset: () => void;
  streak: number;
  sectionCompleted: (sectionId: string) => number;
}

const ProgressContext = createContext<ProgressApi | null>(null);

function addDay(days: string[], day: string): string[] {
  return days.includes(day) ? days : [...days, day].sort();
}

/** Consecutive active days ending today (or yesterday, so the streak survives until you practise). */
export function computeStreak(days: string[], now = new Date()): number {
  const set = new Set(days);
  const cursor = new Date(now);
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(todayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => ({ ...EMPTY, ...readJSON(STORAGE_KEY, EMPTY) }));

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    writeJSON(STORAGE_KEY, state);
  }, [state]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState({ ...EMPTY, ...readJSON(STORAGE_KEY, EMPTY) });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recordResult = useCallback((ex: { id: string; section: string }, score: number | null) => {
    setState((s) => {
      const prev = s.exercises[ex.id];
      const next: ExerciseProgress = {
        section: ex.section,
        completed: true,
        attempts: (prev?.attempts ?? 0) + 1,
        updatedAt: new Date().toISOString(),
        lastScore: score ?? prev?.lastScore,
        bestScore: score === null ? prev?.bestScore : Math.max(score, prev?.bestScore ?? 0),
      };
      return { ...s, exercises: { ...s.exercises, [ex.id]: next }, activeDays: addDay(s.activeDays, todayKey()) };
    });
  }, []);

  const markVisited = useCallback((ex: Pick<ExerciseSummary, "id" | "section" | "title">) => {
    setState((s) => ({
      ...s,
      lastVisited: { id: ex.id, section: ex.section, title: ex.title, at: new Date().toISOString() },
    }));
  }, []);

  const setNote = useCallback((id: string, text: string) => {
    setState((s) => ({ ...s, notes: { ...s.notes, [id]: text } }));
  }, []);

  const saveAssessment = useCallback((id: string, ratings: Record<string, number>) => {
    setState((s) => ({ ...s, assessments: { ...s.assessments, [id]: ratings } }));
  }, []);

  /** Saves the score if it beats the stored best. Returns true for a new record. */
  const saveQuizScore = useCallback((id: string, points: number) => {
    const isRecord = points > (stateRef.current.quizBest[id] ?? 0);
    if (isRecord) setState((s) => ({ ...s, quizBest: { ...s.quizBest, [id]: Math.max(points, s.quizBest[id] ?? 0) } }));
    return isRecord;
  }, []);

  const addExamRecord = useCallback((rec: ExamRecord) => {
    setState((s) => ({
      ...s,
      examHistory: [rec, ...s.examHistory].slice(0, 30),
      activeDays: addDay(s.activeDays, todayKey()),
    }));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo<ProgressApi>(
    () => ({
      state,
      recordResult,
      markVisited,
      setNote,
      saveAssessment,
      saveQuizScore,
      addExamRecord,
      reset,
      streak: computeStreak(state.activeDays),
      sectionCompleted: (sectionId) =>
        Object.values(state.exercises).filter((e) => e.section === sectionId && e.completed).length,
    }),
    [state, recordResult, markVisited, setNote, saveAssessment, saveQuizScore, addExamRecord, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}
