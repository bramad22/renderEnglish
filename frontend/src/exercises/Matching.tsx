import { motion } from "framer-motion";
import { ChevronDown, CircleCheck, CircleX } from "lucide-react";
import { useMemo, useState } from "react";
import type { MatchingEx } from "../api/types";
import { Explanation, ScoreSummary } from "../components/ui";
import { cn, shuffle } from "../lib/utils";
import type { ExerciseProps } from "./types";

export function Matching({ ex, onComplete }: ExerciseProps<MatchingEx>) {
  const [round, setRound] = useState(0);
  const leftOrder = useMemo(() => shuffle(ex.pairs.map((_, i) => i)), [ex, round]);
  const options = useMemo(() => shuffle([...ex.pairs.map((p) => p.right), ...ex.distractors]), [ex, round]);
  const [choice, setChoice] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const used = new Set(Object.values(choice));
  const allChosen = ex.pairs.every((_, i) => choice[i]);
  const correct = ex.pairs.filter((p, i) => choice[i] === p.right).length;

  const check = () => {
    setChecked(true);
    onComplete(correct / ex.pairs.length);
  };
  const retry = () => {
    setChoice({});
    setChecked(false);
    setRound((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <div className="card divide-y divide-slate-100 dark:divide-white/5">
        <div className="hidden grid-cols-[1fr_1fr] gap-4 px-5 py-3 sm:grid">
          <span className="eyebrow">{ex.left_label}</span>
          <span className="eyebrow">{ex.right_label}</span>
        </div>
        {leftOrder.map((i, n) => {
          const pair = ex.pairs[i];
          const isRight = choice[i] === pair.right;
          return (
            <div key={i} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr] sm:items-center sm:gap-4">
              <label htmlFor={`m-${ex.id}-${i}`} className="text-[15px] font-medium text-slate-900 dark:text-white">
                <span className="mr-2 text-xs text-slate-400">{n + 1}.</span>
                {pair.left}
              </label>
              <div>
                <div className="relative">
                  <select
                    id={`m-${ex.id}-${i}`}
                    className={cn(
                      "input appearance-none pr-10",
                      checked && (isRight ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10" : "border-rose-400 bg-rose-50 dark:border-rose-500/60 dark:bg-rose-500/10"),
                    )}
                    value={choice[i] ?? ""}
                    disabled={checked}
                    onChange={(e) => setChoice((c) => ({ ...c, [i]: e.target.value }))}
                  >
                    <option value="" disabled>
                      Choose {ex.right_label.toLowerCase()}…
                    </option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {used.has(o) && choice[i] !== o ? "✓ " : ""}
                        {o}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
                {checked && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex gap-2 text-sm" role="status">
                    {isRight ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <CircleX className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
                    )}
                    <span className="text-slate-600 dark:text-slate-300">
                      {isRight ? "Correct." : <>Correct answer: <strong>{pair.right}</strong>.</>} {pair.explanation}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!checked ? (
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={!allChosen} onClick={check}>
            Check answers
          </button>
          {!allChosen && <span className="text-sm text-slate-500">Match every item first.</span>}
        </div>
      ) : (
        <>
          <Explanation>{ex.explanation}</Explanation>
          <ScoreSummary correct={correct} total={ex.pairs.length} onRetry={retry} />
        </>
      )}
    </div>
  );
}
