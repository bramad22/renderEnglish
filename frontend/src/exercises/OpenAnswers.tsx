import { motion } from "framer-motion";
import { CircleCheck, Square, SquareCheck } from "lucide-react";
import { useState } from "react";
import type { RewriteEx, ShortAnswerEx } from "../api/types";
import { Reveal } from "../components/ui";
import { cn } from "../lib/utils";
import type { ExerciseProps } from "./types";

interface OpenItem {
  prompt: string;
  model: string;
  keyPoints: string[];
}

/** Button that completes a self-checked task. */
export function DoneBar({ onDone, label = "Mark as done", hint }: { onDone: () => void; label?: string; hint?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-400">{hint ?? "Finished? Mark the task as done to track your progress."}</p>
      {done ? (
        <motion.span initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400" role="status">
          <CircleCheck className="size-5" aria-hidden /> Saved to your progress
        </motion.span>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            setDone(true);
            onDone();
          }}
        >
          <CircleCheck className="size-4" aria-hidden /> {label}
        </button>
      )}
    </div>
  );
}

/** Write an answer, reveal the model answer, tick off the key points you covered. */
function OpenAnswerList({ items, promptLabel, onComplete }: { items: OpenItem[]; promptLabel: string; onComplete: (s: number) => void }) {
  const [texts, setTexts] = useState<string[]>(() => items.map(() => ""));
  const [ticks, setTicks] = useState<boolean[][]>(() => items.map((it) => it.keyPoints.map(() => false)));
  const total = items.reduce((n, it) => n + it.keyPoints.length, 0);
  const covered = ticks.flat().filter(Boolean).length;

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className="card p-5">
          <p className="eyebrow mb-1">
            {promptLabel} {i + 1}
          </p>
          <p className="mb-3 text-[15.5px] font-medium text-slate-900 dark:text-white">{it.prompt}</p>
          <label className="sr-only" htmlFor={`oa-${i}`}>
            Your answer
          </label>
          <textarea
            id={`oa-${i}`}
            className="input min-h-24 resize-y"
            placeholder="Write or say your answer first…"
            value={texts[i]}
            onChange={(e) => setTexts((t) => t.map((v, k) => (k === i ? e.target.value : v)))}
          />
          <Reveal className="mt-3" label="Show model answer" hideLabel="Hide model answer">
            <div className="rounded-xl bg-indigo-50/70 p-4 dark:bg-indigo-500/10">
              <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">{it.model}</p>
              <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Key points – tick the ones you covered</p>
              <ul className="space-y-1">
                {it.keyPoints.map((kp, k) => {
                  const on = ticks[i][k];
                  return (
                    <li key={k}>
                      <button
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => setTicks((t) => t.map((row, r) => (r === i ? row.map((v, c) => (c === k ? !v : v)) : row)))}
                        className={cn("flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-white/60 dark:hover:bg-white/5", on && "text-emerald-800 dark:text-emerald-300")}
                      >
                        {on ? <SquareCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Square className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />}
                        {kp}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      ))}
      <DoneBar
        hint={`Key points covered: ${covered} of ${total}. Your score is based on the points you ticked.`}
        onDone={() => onComplete(total ? covered / total : 1)}
      />
    </div>
  );
}

export function ShortAnswer({ ex, onComplete }: ExerciseProps<ShortAnswerEx>) {
  return (
    <OpenAnswerList
      promptLabel="Question"
      onComplete={onComplete}
      items={ex.questions.map((q) => ({ prompt: q.question, model: q.model_answer, keyPoints: q.key_points }))}
    />
  );
}

export function Rewrite({ ex, onComplete }: ExerciseProps<RewriteEx>) {
  return (
    <OpenAnswerList
      promptLabel="Sentence"
      onComplete={onComplete}
      items={ex.items.map((it) => ({ prompt: it.original, model: it.model_answer, keyPoints: it.key_points }))}
    />
  );
}
