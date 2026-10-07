import { useEffect, useMemo, useRef, useState } from "react";
import type { ErrorCorrectionEx } from "../api/types";
import { Feedback, ScoreSummary } from "../components/ui";
import { cn } from "../lib/utils";
import type { ExerciseProps } from "./types";

interface Token {
  text: string;
  start: number;
  end: number;
  inError: boolean;
}

function tokenize(sentence: string, error: string): Token[] {
  const eStart = sentence.indexOf(error);
  const eEnd = eStart + error.length;
  const tokens: Token[] = [];
  for (const m of sentence.matchAll(/\S+/g)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    tokens.push({ text: m[0], start, end, inError: start < eEnd && end > eStart });
  }
  return tokens;
}

type ItemState = { selected: number[]; result: boolean | null };

/** Tap the wrong word(s). Correct if every selected word is part of the error. */
export function ErrorCorrection({ ex, onComplete }: ExerciseProps<ErrorCorrectionEx>) {
  const tokenized = useMemo(() => ex.items.map((it) => tokenize(it.sentence, it.error)), [ex]);
  const fresh = () => ex.items.map((): ItemState => ({ selected: [], result: null }));
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

  const toggle = (i: number, t: number) =>
    setItems((all) =>
      all.map((s, k) =>
        k !== i || s.result !== null ? s : { ...s, selected: s.selected.includes(t) ? s.selected.filter((x) => x !== t) : [...s.selected, t] },
      ),
    );

  const check = (i: number) =>
    setItems((all) =>
      all.map((s, k) => {
        if (k !== i) return s;
        const toks = tokenized[i];
        const ok = s.selected.length > 0 && s.selected.every((t) => toks[t].inError);
        return { ...s, result: ok };
      }),
    );

  const reveal = (i: number) => setItems((all) => all.map((s, k) => (k === i ? { ...s, result: false } : s)));

  return (
    <div className="space-y-4">
      {ex.items.map((item, i) => {
        const state = items[i];
        const checked = state.result !== null;
        return (
          <div key={i} className="card p-5">
            <p className="mb-1 text-xs font-medium text-slate-400">Sentence {i + 1}</p>
            <p className="flex flex-wrap gap-x-1 gap-y-1.5 text-[16px] leading-relaxed">
              {tokenized[i].map((tok, t) => {
                const sel = state.selected.includes(t);
                return (
                  <button
                    key={t}
                    disabled={checked}
                    aria-pressed={sel}
                    onClick={() => toggle(i, t)}
                    className={cn(
                      "rounded-md px-1 py-0.5 transition",
                      !checked && !sel && "hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
                      !checked && sel && "bg-indigo-600 text-white",
                      checked && tok.inError && "bg-rose-100 text-rose-900 line-through decoration-rose-500 decoration-2 dark:bg-rose-500/20 dark:text-rose-100",
                      checked && !tok.inError && sel && "bg-slate-200 dark:bg-white/10",
                    )}
                  >
                    {tok.text}
                  </button>
                );
              })}
            </p>
            {!checked ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-primary min-h-10" disabled={state.selected.length === 0} onClick={() => check(i)}>
                  Check
                </button>
                <button className="btn-ghost min-h-10" onClick={() => reveal(i)}>
                  Show solution
                </button>
              </div>
            ) : (
              <Feedback correct={!!state.result} title={state.result ? "Well spotted!" : "The mistake is highlighted above."}>
                <span className="mt-1 block">
                  <span className="font-medium">Correct: </span>
                  <span className="text-emerald-700 dark:text-emerald-300">{item.correction}</span>
                </span>
                <span className="mt-1 block opacity-90">{item.explanation}</span>
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
