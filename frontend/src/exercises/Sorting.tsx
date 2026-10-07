import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { SortingEx } from "../api/types";
import { Explanation, ScoreSummary } from "../components/ui";
import { cn, shuffle } from "../lib/utils";
import type { ExerciseProps } from "./types";

/** Tap an item, then tap a category. Works with mouse, touch and keyboard. */
export function Sorting({ ex, onComplete }: ExerciseProps<SortingEx>) {
  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffle(ex.items.map((_, i) => i)), [ex, round]);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const pool = order.filter((i) => placed[i] === undefined);
  const correct = ex.items.filter((it, i) => placed[i] === it.category).length;

  const place = (cat: string) => {
    if (selected === null || checked) return;
    setPlaced((p) => ({ ...p, [selected]: cat }));
    const nextInPool = pool.find((i) => i !== selected);
    setSelected(nextInPool ?? null);
  };
  const unplace = (i: number) => {
    if (checked) return;
    setPlaced((p) => {
      const n = { ...p };
      delete n[i];
      return n;
    });
    setSelected(i);
  };
  const check = () => {
    setChecked(true);
    onComplete(correct / ex.items.length);
  };
  const retry = () => {
    setPlaced({});
    setChecked(false);
    setSelected(null);
    setRound((r) => r + 1);
  };

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div className="card p-5">
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            {pool.length
              ? selected !== null
                ? `Selected: “${ex.items[selected].text}”. Now choose a category below.`
                : "Tap an item to select it."
              : "All items placed. Check your answers or tap an item in a category to move it back."}
          </p>
          <div className="flex min-h-12 flex-wrap gap-2">
            <AnimatePresence>
              {pool.map((i) => (
                <motion.button
                  layout
                  layoutId={`sort-${ex.id}-${i}`}
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={cn(
                    "min-h-10 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                    selected === i
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                      : "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 dark:border-white/10 dark:bg-ink-850 dark:text-slate-100",
                  )}
                >
                  {ex.items[i].text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className={cn("grid gap-3", ex.categories.length > 4 ? "grid-cols-2 lg:grid-cols-3" : ex.categories.length === 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
          {ex.categories.map((cat) => {
            const inCat = order.filter((i) => placed[i] === cat);
            return (
              <div
                key={cat}
                className={cn(
                  "card flex flex-col p-4 transition",
                  selected !== null && !checked && "ring-2 ring-indigo-400/40 ring-offset-0",
                )}
              >
                <button
                  className="mb-3 flex min-h-10 items-center justify-between rounded-lg bg-slate-100 px-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-indigo-100 disabled:hover:bg-slate-100 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-indigo-500/20"
                  onClick={() => place(cat)}
                  disabled={selected === null || checked}
                  aria-label={`Put selected item into ${cat}`}
                >
                  {cat}
                  <span className="text-xs font-normal text-slate-500">{inCat.length}</span>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {inCat.map((i) => {
                    const ok = ex.items[i].category === cat;
                    return (
                      <motion.button
                        layout
                        layoutId={`sort-${ex.id}-${i}`}
                        key={i}
                        onClick={() => unplace(i)}
                        disabled={checked}
                        title={checked ? (ok ? "Correct" : `Belongs in: ${ex.items[i].category}`) : "Tap to move back"}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium",
                          !checked && "bg-indigo-50 text-indigo-900 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-100",
                          checked && ok && "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100",
                          checked && !ok && "bg-rose-100 text-rose-900 line-through decoration-rose-400 dark:bg-rose-500/20 dark:text-rose-100",
                        )}
                      >
                        {ex.items[i].text}
                        {!checked && <Undo2 className="size-3 opacity-50" aria-hidden />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!checked ? (
          <button className="btn-primary" disabled={pool.length > 0} onClick={check}>
            Check answers
          </button>
        ) : (
          <>
            {correct < ex.items.length && (
              <div className="card p-5">
                <p className="mb-2 text-sm font-semibold">Corrections</p>
                <ul className="space-y-1.5 text-sm">
                  {ex.items.map((it, i) =>
                    placed[i] !== it.category ? (
                      <li key={i} className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">{it.text}</strong> → {it.category}
                        {it.explanation && <span className="text-slate-500"> ({it.explanation})</span>}
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            )}
            <Explanation>{ex.explanation}</Explanation>
            <ScoreSummary correct={correct} total={ex.items.length} onRetry={retry} />
          </>
        )}
      </div>
    </LayoutGroup>
  );
}
