import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { MultipleChoiceEx, TFNGEx } from "../api/types";
import { Feedback, ScoreSummary } from "../components/ui";
import { cn } from "../lib/utils";
import type { ExerciseProps } from "./types";

interface ChoiceItem {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

/** Shared engine for multiple choice and true / false / not given: instant feedback per question. */
function ChoiceQuestions({ items, onComplete, highlightGap = false }: { items: ChoiceItem[]; onComplete: (s: number) => void; highlightGap?: boolean }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null));
  const [round, setRound] = useState(0);
  const reported = useRef(false);

  const answeredCount = answers.filter((a) => a !== null).length;
  const correctCount = answers.filter((a, i) => a === items[i].answer).length;
  const finished = answeredCount === items.length;

  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true;
      onComplete(correctCount / items.length);
    }
  }, [finished, correctCount, items.length, onComplete]);

  const retry = () => {
    setAnswers(items.map(() => null));
    reported.current = false;
    setRound((r) => r + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4" key={round}>
      <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {answeredCount} of {items.length} answered
      </p>
      {items.map((q, qi) => {
        const chosen = answers[qi];
        const locked = chosen !== null;
        return (
          <motion.fieldset
            key={qi}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(qi * 0.04, 0.3) }}
            className="card p-5"
          >
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="mb-3 flex gap-3 text-[15.5px] font-medium text-slate-900 dark:text-white">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">{qi + 1}</span>
              <span>{highlightGap ? renderGap(q.prompt) : q.prompt}</span>
            </p>
            <div className={cn("grid gap-2", q.options.length <= 3 && q.options.every((o) => o.length < 16) ? "grid-cols-3" : q.options.every((o) => o.length < 22) ? "grid-cols-2" : "grid-cols-1")}>
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isChosen = oi === chosen;
                return (
                  <button
                    key={oi}
                    disabled={locked}
                    aria-pressed={isChosen}
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                    className={cn(
                      "min-h-11 rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                      !locked && "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-ink-850 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/10",
                      locked && isAnswer && "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-100",
                      locked && isChosen && !isAnswer && "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500/60 dark:bg-rose-500/15 dark:text-rose-100",
                      locked && !isAnswer && !isChosen && "border-slate-200 bg-white opacity-50 dark:border-white/10 dark:bg-ink-850",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {locked && (
              <Feedback correct={chosen === q.answer} title={chosen === q.answer ? "Correct!" : `The answer is “${q.options[q.answer]}”.`}>
                {q.explanation}
              </Feedback>
            )}
          </motion.fieldset>
        );
      })}
      {finished && <ScoreSummary correct={correctCount} total={items.length} onRetry={retry} />}
    </div>
  );
}

function renderGap(text: string) {
  const parts = text.split("___");
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <span className="mx-1 inline-block w-14 border-b-2 border-indigo-400 align-baseline" aria-label="gap" />}
    </span>
  ));
}

export function MultipleChoice({ ex, onComplete }: ExerciseProps<MultipleChoiceEx>) {
  return <ChoiceQuestions items={ex.questions} onComplete={onComplete} highlightGap />;
}

const TFNG_OPTIONS = ["True", "False", "Not given"];
const TFNG_INDEX = { true: 0, false: 1, not_given: 2 } as const;

export function TrueFalseNotGiven({ ex, onComplete }: ExerciseProps<TFNGEx>) {
  const items = ex.statements.map((s) => ({
    prompt: s.statement,
    options: TFNG_OPTIONS,
    answer: TFNG_INDEX[s.answer],
    explanation: s.explanation,
  }));
  return <ChoiceQuestions items={items} onComplete={onComplete} />;
}
