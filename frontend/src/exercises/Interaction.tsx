import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Eye, EyeOff, Lock, MessageSquareReply, Square, SquareCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { Argument, DebateEx, DilemmaEx, RoleplayEx } from "../api/types";
import { NotesArea, PhrasePanel, TimerPanel } from "../components/speaking";
import { Collapsible, Reveal } from "../components/ui";
import { cn } from "../lib/utils";
import { DoneBar } from "./OpenAnswers";
import type { ExerciseProps } from "./types";

function ArgumentCard({ arg, side }: { arg: Argument; side: "for" | "against" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-ink-850">
      <button className="flex w-full items-start justify-between gap-2 p-4 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="font-semibold text-slate-900 dark:text-white">{arg.point}</span>
        <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4 text-sm">
              <p className="text-slate-700 dark:text-slate-300">{arg.explanation}</p>
              <div className={cn("flex gap-2 rounded-lg p-3", side === "for" ? "bg-rose-50 dark:bg-rose-500/10" : "bg-emerald-50 dark:bg-emerald-500/10")}>
                <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
                <p>
                  <span className="font-semibold">Counter-argument: </span>
                  {arg.counter}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Checklist({ items, title }: { items: string[]; title: string }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  return (
    <div className="card p-5">
      <p className="mb-3 font-semibold">{title}</p>
      <ul className="space-y-1">
        {items.map((t, i) => (
          <li key={t}>
            <button
              role="checkbox"
              aria-checked={done[i]}
              onClick={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))}
              className={cn("flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-[15px] transition hover:bg-slate-50 dark:hover:bg-white/5", done[i] && "text-slate-400 line-through")}
            >
              {done[i] ? <SquareCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden /> : <Square className="mt-0.5 size-5 shrink-0 text-slate-300" aria-hidden />}
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Debate({ ex, onComplete }: ExerciseProps<DebateEx>) {
  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" aria-hidden />
        <p className="eyebrow relative mb-2">The motion</p>
        <p className="relative font-display text-2xl leading-snug font-semibold text-slate-900 sm:text-3xl dark:text-white">“{ex.motion}”</p>
        <p className="relative mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{ex.context}</p>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Tap an argument to see the explanation and a counter-argument.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-muted p-4" aria-label="Arguments for">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <ThumbsUp className="size-4" aria-hidden /> For the motion
          </h3>
          <div className="space-y-2">
            {ex.arguments_for.map((a) => (
              <ArgumentCard key={a.point} arg={a} side="for" />
            ))}
          </div>
        </section>
        <section className="card-muted p-4" aria-label="Arguments against">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-400">
            <ThumbsDown className="size-4" aria-hidden /> Against the motion
          </h3>
          <div className="space-y-2">
            {ex.arguments_against.map((a) => (
              <ArgumentCard key={a.point} arg={a} side="against" />
            ))}
          </div>
        </section>
      </div>
      <Collapsible title="Phrase bank" defaultOpen>
        <PhrasePanel groups={ex.phrases} />
      </Collapsible>
      <Checklist title="Your tasks" items={ex.tasks} />
      <TimerPanel prepSeconds={60} speakSeconds={120} />
      <NotesArea id={ex.id} placeholder="Your position, best arguments, examples…" />
      <DoneBar onDone={() => onComplete(null)} />
    </div>
  );
}

export function Roleplay({ ex, onComplete }: ExerciseProps<RoleplayEx>) {
  const [visible, setVisible] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <p className="eyebrow mb-2">Situation</p>
        <p className="text-[16px] leading-relaxed text-slate-800 dark:text-slate-200">{ex.situation}</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Lock className="size-4" aria-hidden /> Role cards are hidden. Each person opens only their own card – pass the phone around.
      </div>
      <div className={cn("grid gap-3", ex.roles.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {ex.roles.map((r, i) => {
          const open = visible === i;
          return (
            <div key={r.name} className={cn("card flex flex-col p-5 transition", open && "ring-2 ring-emerald-400/60")}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">
                  <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">{String.fromCharCode(65 + i)}</span>
                  {r.name}
                </p>
                <button className="btn-ghost min-h-9 px-2.5" aria-expanded={open} onClick={() => setVisible(open ? null : i)}>
                  {open ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  <span className="text-xs">{open ? "Hide" : "Show"}</span>
                </button>
              </div>
                {open ? (
                  <motion.div key="open" initial={{ opacity: 0, rotateX: -10 }} animate={{ opacity: 1, rotateX: 0 }} exit={{ opacity: 0 }} className="space-y-3 text-sm">
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">{r.card}</p>
                    <div>
                      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Your goals</p>
                      <ul className="space-y-1">
                        {r.goals.map((g) => (
                          <li key={g} className="flex gap-2 text-slate-700 dark:text-slate-300">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid flex-1 place-items-center rounded-xl bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgb(148_163_184/0.08)_8px,rgb(148_163_184/0.08)_16px)] py-8 text-xs text-slate-400">
                    Hidden role card
                  </motion.div>
                )}
            </div>
          );
        })}
      </div>
      <Collapsible title="Useful phrases" defaultOpen>
        <PhrasePanel groups={ex.useful_phrases} />
      </Collapsible>
      <TimerPanel prepSeconds={120} speakSeconds={360} />
      <Checklist title="Debrief – discuss afterwards" items={ex.debrief} />
      <DoneBar onDone={() => onComplete(null)} />
    </div>
  );
}

export function Dilemma({ ex, onComplete }: ExerciseProps<DilemmaEx>) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <p className="eyebrow mb-2">The case</p>
        <p className="text-[16px] leading-relaxed text-slate-800 dark:text-slate-200">{ex.case}</p>
      </div>
      <div className="card p-5">
        <p className="mb-3 font-semibold">What would you do? Choose one option.</p>
        <div role="radiogroup" aria-label="Options" className="grid gap-2">
          {ex.options.map((o, i) => (
            <button
              key={o}
              role="radio"
              aria-checked={choice === i}
              onClick={() => setChoice(i)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[15px] transition",
                choice === i
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-50"
                  : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20",
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold dark:bg-white/10">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
        </div>
        {choice !== null && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Now justify your choice out loud. Use the guiding questions below.</p>}
      </div>
      <Checklist title="Guiding questions" items={ex.guiding_questions} />
      <Collapsible title="Perspectives to consider">
        <ul className="space-y-3">
          {ex.perspectives.map((p) => (
            <li key={p.stakeholder}>
              <p className="font-semibold text-slate-900 dark:text-white">{p.stakeholder}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{p.view}</p>
            </li>
          ))}
        </ul>
      </Collapsible>
      <NotesArea id={ex.id} placeholder="Your decision and reasons…" />
      <div className="card p-5">
        <Reveal label="Show what a strong answer includes" hideLabel="Hide model answer">
          <p className="rounded-xl bg-indigo-50/70 p-4 text-[15px] leading-relaxed dark:bg-indigo-500/10">{ex.model_answer}</p>
        </Reveal>
      </div>
      <DoneBar onDone={() => onComplete(null)} />
    </div>
  );
}
