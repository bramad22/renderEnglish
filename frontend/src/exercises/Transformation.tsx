import { useEffect, useRef, useState } from "react";
import type { TransformationEx } from "../api/types";
import { Feedback, ScoreSummary } from "../components/ui";
import { cn, normaliseAnswer } from "../lib/utils";
import type { ExerciseProps } from "./types";

type ItemState = { value: string; result: boolean | null };

export function Transformation({ ex, onComplete }: ExerciseProps<TransformationEx>) {
  const fresh = () => ex.items.map((): ItemState => ({ value: "", result: null }));
  const [items, setItems] = useState<ItemState[]>(fresh);
  const reported = useRef(false);
  const done = items.every((s) => s.result !== null);
  const correct = items.filter((s) => s.result).length;

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onComplete(correct / ex.items.length);
    }
  }, [done, correct, ex.items.length, onComplete]);

  const update = (i: number, patch: Partial<ItemState>) => setItems((all) => all.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const check = (i: number) => {
    const accepted = ex.items[i].accepted_answers.map(normaliseAnswer);
    update(i, { result: accepted.includes(normaliseAnswer(items[i].value)) });
  };

  return (
    <div className="space-y-4">
      {ex.items.map((item, i) => {
        const s = items[i];
        const [before, after] = item.gapped.split("___");
        const isWordForm = !item.keyword && /^[A-Z]+$/.test(item.original);
        return (
          <div key={i} className="card p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <p className="text-[15px] text-slate-600 dark:text-slate-400">
                {isWordForm ? (
                  <>
                    Word: <span className="font-semibold tracking-wide text-slate-900 dark:text-white">{item.original}</span>
                  </>
                ) : (
                  item.original
                )}
              </p>
              {item.keyword && (
                <span className="chip bg-slate-900 font-bold tracking-wider text-white dark:bg-white dark:text-slate-900">{item.keyword}</span>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (s.result === null && s.value.trim()) check(i);
              }}
              className="text-[16px] leading-[2.4]"
            >
              <span>{before}</span>
              <input
                aria-label={`Answer for sentence ${i + 1}`}
                className={cn(
                  "mx-1 inline-block w-full max-w-64 rounded-lg border-b-2 bg-slate-50 px-2 py-1 align-middle text-[15px] leading-normal outline-none sm:w-64 dark:bg-white/5",
                  s.result === null && "border-indigo-400 focus:bg-indigo-50 dark:focus:bg-indigo-500/10",
                  s.result === true && "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                  s.result === false && "border-rose-500 bg-rose-50 dark:bg-rose-500/10",
                )}
                value={s.value}
                disabled={s.result !== null}
                autoCapitalize="off"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => update(i, { value: e.target.value })}
              />
              <span>{after}</span>
              {s.result === null && (
                <div className="mt-2 flex flex-wrap gap-2 leading-normal">
                  <button type="submit" className="btn-primary min-h-10" disabled={!s.value.trim()}>
                    Check
                  </button>
                  <button type="button" className="btn-ghost min-h-10" onClick={() => update(i, { result: false })}>
                    Show answer
                  </button>
                </div>
              )}
            </form>
            {s.result !== null && (
              <Feedback correct={s.result} title={s.result ? "Correct!" : "Model answer:"}>
                {!s.result && <strong className="text-emerald-700 dark:text-emerald-300">{item.accepted_answers.join(" / ")}</strong>}
                <span className="mt-1 block opacity-90">{item.explanation}</span>
                {!s.result && s.value && (
                  <span className="mt-1 block text-xs opacity-75">If your answer is very close (e.g. a different contraction), give yourself the point.</span>
                )}
              </Feedback>
            )}
          </div>
        );
      })}
      {done && (
        <ScoreSummary
          correct={correct}
          total={ex.items.length}
          onRetry={() => {
            reported.current = false;
            setItems(fresh());
          }}
        />
      )}
    </div>
  );
}
