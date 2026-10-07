import { motion } from "framer-motion";
import { CircleCheck, Image as ImageIcon, Megaphone, Minus, Newspaper, Pause, Play, Plus, Quote, RotateCcw, SkipForward, StickyNote, Type } from "lucide-react";
import { useEffect, useState } from "react";
import type { PhraseGroup, Stimulus } from "../api/types";
import { useCountdown } from "../hooks/useCountdown";
import { useProgress } from "../hooks/useProgress";
import { beep, cn, formatSeconds } from "../lib/utils";

export function StimulusCard({ stimulus }: { stimulus: Stimulus }) {
  const lines = stimulus.content.split("\n");
  if (stimulus.kind === "quote") {
    return (
      <figure className="card relative overflow-hidden p-6 sm:p-8">
        <Quote className="absolute -top-2 -left-1 size-24 text-indigo-500/10" aria-hidden />
        <blockquote className="relative font-display text-2xl leading-snug font-medium text-slate-900 sm:text-3xl dark:text-white">{stimulus.content}</blockquote>
        <figcaption className="relative mt-4 text-sm text-slate-500 dark:text-slate-400">— {stimulus.title}</figcaption>
      </figure>
    );
  }
  if (stimulus.kind === "headline") {
    return (
      <div className="card p-5 sm:p-7">
        <p className="eyebrow mb-3 flex items-center gap-1.5">
          <Newspaper className="size-3.5" aria-hidden /> {stimulus.title}
        </p>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <p key={i} className="border-l-4 border-slate-900 pl-4 font-display text-lg leading-snug font-semibold text-slate-900 sm:text-xl dark:border-white dark:text-white">
              {l}
            </p>
          ))}
        </div>
      </div>
    );
  }
  if (stimulus.kind === "image") {
    return (
      <figure className="card overflow-hidden">
        <div className="relative grid aspect-[16/7] place-items-center bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100 dark:from-ink-800 dark:via-ink-850 dark:to-indigo-950">
          <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
            <ImageIcon className="size-9" aria-hidden />
            <span className="text-xs font-medium tracking-wide uppercase">Picture described in words</span>
          </div>
        </div>
        <figcaption className="p-5 sm:p-6">
          <p className="eyebrow mb-2">{stimulus.title}</p>
          <p className="text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300">{stimulus.content}</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Tip: imagine the picture in front of you and describe it as if you could see it.</p>
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="card p-5 sm:p-7">
      <p className="eyebrow mb-3 flex items-center gap-1.5">
        {stimulus.kind === "chart" ? <Megaphone className="size-3.5" aria-hidden /> : <Type className="size-3.5" aria-hidden />} {stimulus.title}
      </p>
      <div className="space-y-1.5 text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </div>
  );
}

/** Two-phase timer: preparation, then speaking. Durations can be adjusted before starting. */
export function TimerPanel({ prepSeconds, speakSeconds }: { prepSeconds: number; speakSeconds: number }) {
  const [phase, setPhase] = useState<"prep" | "speak">("prep");
  const timer = useCountdown(prepSeconds, () => {
    beep(phase === "prep" ? 660 : 880, 350);
    if (phase === "prep") {
      setPhase("speak");
    }
  });

  // When the phase switches, load the speaking duration.
  useEffect(() => {
    timer.reset(phase === "prep" ? prepSeconds : speakSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const adjust = (delta: number) => timer.reset(Math.max(30, Math.min(1800, timer.duration + delta)));
  const isPrep = phase === "prep";
  const done = !timer.running && timer.remaining <= 0;
  const size = 148;
  const r = 64;
  const c = 2 * Math.PI * r;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div role="tablist" aria-label="Timer phase" className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {(["prep", "speak"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={phase === p}
              onClick={() => setPhase(p)}
              className={cn(
                "min-h-9 rounded-lg px-3 text-sm font-medium transition",
                phase === p ? "bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-white" : "text-slate-500 dark:text-slate-400",
              )}
            >
              {p === "prep" ? "Prepare" : "Speak"}
            </button>
          ))}
        </div>
        {!timer.running && (
          <div className="flex items-center gap-1">
            <button className="btn-ghost min-h-9 px-2" onClick={() => adjust(-30)} aria-label="Remove 30 seconds">
              <Minus className="size-4" />
            </button>
            <button className="btn-ghost min-h-9 px-2" onClick={() => adjust(30)} aria-label="Add 30 seconds">
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={9} fill="none" className="stroke-slate-100 dark:stroke-white/5" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
              className={cn("transition-[stroke-dashoffset] duration-200", isPrep ? "stroke-indigo-500" : "stroke-rose-500")}
              strokeDasharray={c}
              strokeDashoffset={c * timer.progress}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-semibold tabular-nums text-slate-900 dark:text-white" aria-live="off">
              {formatSeconds(timer.remaining)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{done ? "Time’s up" : isPrep ? "preparation" : "speaking"}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {timer.running ? (
            <button className="btn-secondary" onClick={timer.pause}>
              <Pause className="size-4" aria-hidden /> Pause
            </button>
          ) : (
            <button className="btn-primary" onClick={timer.start}>
              <Play className="size-4" aria-hidden /> {timer.remaining < timer.duration && timer.remaining > 0 ? "Resume" : "Start"}
            </button>
          )}
          <button className="btn-ghost" onClick={() => timer.reset()} aria-label="Reset timer">
            <RotateCcw className="size-4" aria-hidden /> Reset
          </button>
          {isPrep && (
            <button className="btn-ghost" onClick={() => setPhase("speak")}>
              <SkipForward className="size-4" aria-hidden /> Start speaking
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="assertive">
          {done ? (isPrep ? "Preparation time is over." : "Speaking time is over.") : ""}
        </p>
      </div>
    </div>
  );
}

export function PhrasePanel({ groups }: { groups: PhraseGroup[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{g.label}</p>
          <ul className="space-y-1.5">
            {g.phrases.map((p) => (
              <li key={p} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Notes are saved per exercise in localStorage, so they survive reloads. */
export function NotesArea({ id, placeholder, readOnly }: { id: string; placeholder?: string; readOnly?: boolean }) {
  const { state, setNote } = useProgress();
  const [value, setValue] = useState(state.notes[id] ?? "");

  useEffect(() => {
    const t = window.setTimeout(() => setNote(id, value), 400);
    return () => window.clearTimeout(t);
  }, [id, value, setNote]);

  return (
    <div className="card p-5">
      <label htmlFor={`notes-${id}`} className="mb-2 flex items-center gap-2 font-semibold">
        <StickyNote className="size-4 text-amber-500" aria-hidden /> Your notes
      </label>
      <textarea
        id={`notes-${id}`}
        className="input min-h-36 resize-y leading-relaxed"
        placeholder={placeholder ?? "Key words, structure, examples … (saved automatically on this device)"}
        value={value}
        readOnly={readOnly}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export const ASSESSMENT_CRITERIA = [
  { key: "content", label: "Content", hint: "I covered all points of the task with relevant ideas and examples." },
  { key: "vocabulary", label: "Range of vocabulary", hint: "I used precise topic words and collocations, not only basic ones." },
  { key: "grammar", label: "Grammar", hint: "I used a variety of structures with few errors." },
  { key: "fluency", label: "Fluency", hint: "I spoke without long pauses and kept going after mistakes." },
  { key: "structure", label: "Structure", hint: "Clear introduction, logical order, linking words and a conclusion." },
] as const;

const LEVELS = ["Needs work", "Okay", "Good", "Excellent"];

export function SelfAssessment({
  initial,
  onSave,
  saveLabel = "Save self-assessment",
}: {
  initial?: Record<string, number>;
  onSave: (ratings: Record<string, number>) => void;
  saveLabel?: string;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(initial ?? {});
  const [saved, setSaved] = useState(false);
  const complete = ASSESSMENT_CRITERIA.every((c) => ratings[c.key]);

  return (
    <div className="space-y-4">
      {ASSESSMENT_CRITERIA.map((c) => (
        <fieldset key={c.key}>
          <legend className="text-sm font-semibold text-slate-900 dark:text-white">{c.label}</legend>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{c.hint}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {LEVELS.map((l, i) => {
              const v = i + 1;
              const active = ratings[c.key] === v;
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setRatings((r) => ({ ...r, [c.key]: v }));
                    setSaved(false);
                  }}
                  className={cn(
                    "min-h-10 rounded-lg px-1 text-[11px] font-medium leading-tight transition sm:text-xs",
                    active
                      ? ["bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"][i] + " text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button
          className="btn-primary"
          disabled={!complete}
          onClick={() => {
            onSave(ratings);
            setSaved(true);
          }}
        >
          {saveLabel}
        </button>
        {saved && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-4" aria-hidden /> Saved
          </motion.span>
        )}
        {!complete && <span className="text-xs text-slate-500">Rate all five areas to save.</span>}
      </div>
    </div>
  );
}

export const ratingScore = (r: Record<string, number>) => {
  const vals = ASSESSMENT_CRITERIA.map((c) => r[c.key] ?? 0);
  return vals.reduce((a, b) => a + b, 0) / (vals.length * 4);
};
