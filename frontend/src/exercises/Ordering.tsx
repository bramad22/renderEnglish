import { Reorder } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useState } from "react";
import type { OrderingEx } from "../api/types";
import { Explanation, ScoreSummary } from "../components/ui";
import { cn, shuffleChanged } from "../lib/utils";
import type { ExerciseProps } from "./types";

/** Drag to reorder (touch or mouse) or use the arrow buttons (keyboard). */
export function Ordering({ ex, onComplete }: ExerciseProps<OrderingEx>) {
  const [items, setItems] = useState(() => shuffleChanged(ex.items));
  const [checked, setChecked] = useState(false);
  const [announce, setAnnounce] = useState("");

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
    setAnnounce(`Moved to position ${to + 1}`);
  };

  const correct = items.filter((it, i) => it === ex.items[i]).length;
  const check = () => {
    setChecked(true);
    onComplete(correct / ex.items.length);
  };
  const retry = () => {
    setChecked(false);
    setItems(shuffleChanged(ex.items));
  };

  return (
    <div className="space-y-4">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <Reorder.Group axis="y" values={items} onReorder={checked ? () => {} : setItems} className="space-y-2">
        {items.map((it, i) => {
          const ok = it === ex.items[i];
          return (
            <Reorder.Item
              key={it}
              value={it}
              dragListener={!checked}
              className={cn(
                "card flex items-center gap-3 p-3 pr-2 sm:p-4",
                !checked && "cursor-grab active:cursor-grabbing active:shadow-lift",
                checked && ok && "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10",
                checked && !ok && "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10",
              )}
            >
              <GripVertical className="size-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">{i + 1}</span>
              <span className="flex-1 text-[15px] leading-snug">
                {it}
                {checked && !ok && <span className="mt-1 block text-xs text-rose-700 dark:text-rose-300">Correct position: {ex.items.indexOf(it) + 1}</span>}
              </span>
              {!checked && (
                <span className="flex flex-col">
                  <button className="btn-ghost min-h-8 px-2 py-1" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move “${it.slice(0, 30)}” up`}>
                    <ChevronUp className="size-4" />
                  </button>
                  <button className="btn-ghost min-h-8 px-2 py-1" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move “${it.slice(0, 30)}” down`}>
                    <ChevronDown className="size-4" />
                  </button>
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {!checked ? (
        <button className="btn-primary" onClick={check}>
          Check order
        </button>
      ) : (
        <>
          <Explanation>{ex.explanation}</Explanation>
          <ScoreSummary correct={correct} total={ex.items.length} onRetry={retry} />
        </>
      )}
    </div>
  );
}
