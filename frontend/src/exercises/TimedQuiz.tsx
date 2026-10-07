import { motion } from "framer-motion";
import { CircleCheck, CircleX, Play, RotateCcw, Timer, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimedQuizEx } from "../api/types";
import { useCountdown } from "../hooks/useCountdown";
import { useProgress } from "../hooks/useProgress";
import { cn, formatSeconds, shuffle } from "../lib/utils";
import type { ExerciseProps } from "./types";

const POINTS_PER_CORRECT = 100;
const BONUS_PER_SECOND = 5;

export function TimedQuiz({ ex, onComplete }: ExerciseProps<TimedQuizEx>) {
  const { state, saveQuizScore } = useProgress();
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [round, setRound] = useState(0);
  const questions = useMemo(() => shuffle(ex.questions), [ex, round]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [flash, setFlash] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ points: number; correct: number; record: boolean } | null>(null);
  const finishing = useRef(false);

  const finish = useCallback(
    (finalAnswers: number[], secondsLeft: number) => {
      if (finishing.current) return;
      finishing.current = true;
      const correct = finalAnswers.filter((a, i) => a === questions[i].answer).length;
      const allAnswered = finalAnswers.length === questions.length;
      const points = correct * POINTS_PER_CORRECT + (allAnswered ? Math.round(secondsLeft) * BONUS_PER_SECOND : 0);
      const record = saveQuizScore(ex.id, points);
      setResult({ points, correct, record });
      setPhase("result");
      onComplete(correct / questions.length);
    },
    [questions, saveQuizScore, ex.id, onComplete],
  );

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const timer = useCountdown(ex.total_seconds, () => finish(answersRef.current, 0));

  const start = () => {
    finishing.current = false;
    setAnswers([]);
    setIndex(0);
    setResult(null);
    setFlash(null);
    setPhase("play");
    timer.reset(ex.total_seconds);
    // start on next tick so the reset has applied
    window.setTimeout(() => timer.start(), 0);
  };

  const answer = (choice: number) => {
    if (flash !== null || phase !== "play") return;
    const q = questions[index];
    const next = [...answers, choice];
    setAnswers(next);
    setFlash(choice === q.answer);
    window.setTimeout(() => {
      setFlash(null);
      if (next.length === questions.length) {
        timer.pause();
        finish(next, timer.remaining);
      } else {
        setIndex((i) => i + 1);
      }
    }, 450);
  };

  // Keyboard shortcuts: 1–4 to answer.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= questions[index].options.length) answer(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const best = state.quizBest[ex.id];

  if (phase === "intro") {
    return (
      <div className="card flex flex-col items-center gap-5 p-8 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25">
          <Timer className="size-8" aria-hidden />
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            {questions.length} questions · {formatSeconds(ex.total_seconds)}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {POINTS_PER_CORRECT} points per correct answer, plus {BONUS_PER_SECOND} bonus points for every second left if you finish. Tip: use keys 1–4.
          </p>
        </div>
        {best !== undefined && (
          <p className="chip bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <Trophy className="size-3.5" aria-hidden /> Your best: {best} points
          </p>
        )}
        <button className="btn-primary px-8" onClick={start}>
          <Play className="size-4" aria-hidden /> Start
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card relative overflow-hidden p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10" aria-hidden />
          <div className="relative">
            {result.record && (
              <motion.p initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="chip mx-auto mb-3 bg-amber-400 font-semibold text-amber-950">
                <Trophy className="size-3.5" aria-hidden /> New personal best!
              </motion.p>
            )}
            <p className="font-display text-5xl font-semibold text-slate-900 tabular-nums dark:text-white">{result.points}</p>
            <p className="text-sm text-slate-500">points</p>
            <p className="mt-3 text-slate-700 dark:text-slate-300" role="status">
              {result.correct} of {questions.length} correct
              {answers.length < questions.length && ` · ${questions.length - answers.length} unanswered (time ran out)`}
            </p>
            <button
              className="btn-primary mt-5"
              onClick={() => {
                setRound((r) => r + 1);
                setPhase("intro");
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Play again
            </button>
          </div>
        </motion.div>
        <div className="card divide-y divide-slate-100 dark:divide-white/5">
          <p className="px-5 py-3 text-sm font-semibold">Review</p>
          {questions.map((q, i) => {
            const a = answers[i];
            const ok = a === q.answer;
            return (
              <div key={i} className="flex gap-3 px-5 py-3 text-sm">
                {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="correct" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-rose-500" aria-label="incorrect" />}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {!ok && a !== undefined && <span className="text-rose-600 line-through dark:text-rose-400">{q.options[a]}</span>} {!ok && a !== undefined && "→ "}
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{q.options[q.answer]}</span> – {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[index];
  const timeLow = timer.remaining < 10;
  return (
    <div className="card overflow-hidden">
      <div className="h-1.5 bg-slate-100 dark:bg-white/5">
        <div className={cn("h-full transition-[width] duration-200 ease-linear", timeLow ? "bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-indigo-500")} style={{ width: `${(timer.remaining / ex.total_seconds) * 100}%` }} />
      </div>
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">
            Question {index + 1} / {questions.length}
          </span>
          <span className={cn("flex items-center gap-1 font-semibold tabular-nums", timeLow ? "text-rose-600" : "text-slate-700 dark:text-slate-200")}>
            <Zap className="size-4" aria-hidden /> {formatSeconds(timer.remaining)}
          </span>
        </div>
          <motion.div key={index} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
            <p className="mb-5 font-display text-xl leading-snug font-semibold text-slate-900 sm:text-2xl dark:text-white">{q.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const picked = answers[index] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => answer(oi)}
                    disabled={flash !== null}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition",
                      flash === null && "border-slate-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/50 dark:border-white/10 dark:hover:bg-fuchsia-500/10",
                      flash !== null && oi === q.answer && "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15",
                      flash === false && picked && "border-rose-400 bg-rose-50 dark:bg-rose-500/15",
                      flash !== null && oi !== q.answer && !picked && "opacity-50",
                    )}
                  >
                    <kbd className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">{oi + 1}</kbd>
                    {o}
                  </button>
                );
              })}
            </div>
          </motion.div>
        <p className="sr-only" aria-live="assertive">
          {flash === true ? "Correct" : flash === false ? "Incorrect" : ""}
        </p>
      </div>
    </div>
  );
}
