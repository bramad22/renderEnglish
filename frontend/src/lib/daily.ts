import type { ExerciseSummary } from "../api/types";
import type { ProgressState } from "../hooks/useProgress";
import { hashString, seededRandom, todayKey } from "./utils";

/**
 * Picks one exercise per day. The choice is stable for the whole day and
 * prefers unfinished exercises from the section with the lowest completion rate.
 */
export function dailySuggestion(all: ExerciseSummary[], progress: ProgressState, date = new Date()): ExerciseSummary | null {
  if (!all.length) return null;
  const rand = seededRandom(hashString(todayKey(date)));
  const open = all.filter((e) => !progress.exercises[e.id]?.completed);
  if (!open.length) return all[Math.floor(rand() * all.length)];

  const bySection = new Map<string, { total: number; done: number }>();
  for (const e of all) {
    const s = bySection.get(e.section) ?? { total: 0, done: 0 };
    s.total++;
    if (progress.exercises[e.id]?.completed) s.done++;
    bySection.set(e.section, s);
  }
  // Weakest sections first; pick among the two weakest so it doesn't feel repetitive.
  const ranked = [...bySection.entries()]
    .filter(([id]) => open.some((e) => e.section === id))
    .sort((a, b) => a[1].done / a[1].total - b[1].done / b[1].total);
  const candidates = ranked.slice(0, 2).map(([id]) => id);
  const section = candidates[Math.floor(rand() * candidates.length)];
  const pool = open.filter((e) => e.section === section);
  return pool[Math.floor(rand() * pool.length)];
}
