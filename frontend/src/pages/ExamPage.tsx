import { motion } from "framer-motion";
import { ArrowRight, Dices, GraduationCap, Info, ListTree, Mic, Pause, Play, RotateCcw, SkipForward, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { SpeakingPromptEx } from "../api/types";
import { ASSESSMENT_CRITERIA, NotesArea, PhrasePanel, SelfAssessment, StimulusCard, ratingScore } from "../components/speaking";
import { Collapsible, DifficultyBadge, ErrorState, LoadingState, Segmented } from "../components/ui";
import { ModelOutline, TaskCard } from "../exercises/SpeakingPrompt";
import { useAsync } from "../hooks/useAsync";
import { useCountdown } from "../hooks/useCountdown";
import { useProgress } from "../hooks/useProgress";
import { beep, cn, formatSeconds, shuffle } from "../lib/utils";

type Step = "setup" | "choose" | "prep" | "speak" | "followup" | "evaluate" | "summary";
const STEPS: { id: Step; label: string }[] = [
  { id: "prep", label: "Prepare" },
  { id: "speak", label: "Speak" },
  { id: "followup", label: "Questions" },
  { id: "evaluate", label: "Evaluate" },
];
const FOLLOW_UP_COUNT = 3;
const FOLLOW_UP_SECONDS = 90;

/** Big countdown used in each exam phase. Resets whenever `seconds` or `phaseKey` changes. */
function PhaseTimer({ seconds, autoStart, onFinish, tone }: { seconds: number; autoStart?: boolean; onFinish?: () => void; tone: "indigo" | "rose" | "sky" }) {
  const t = useCountdown(seconds, () => {
    beep(tone === "rose" ? 880 : 660, 400);
    onFinish?.();
  });
  useEffect(() => {
    if (autoStart) t.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const over = !t.running && t.remaining <= 0;
  const color = { indigo: "from-indigo-500 to-violet-500", rose: "from-rose-500 to-orange-500", sky: "from-sky-500 to-cyan-500" }[tone];
  return (
    <div className="card overflow-hidden">
      <div className="h-2 bg-slate-100 dark:bg-white/5">
        <div className={cn("h-full bg-gradient-to-r transition-[width] duration-200 ease-linear", color)} style={{ width: `${(1 - t.progress) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className={cn("font-display text-4xl font-semibold tabular-nums", over ? "text-rose-600" : "text-slate-900 dark:text-white")}>{formatSeconds(t.remaining)}</p>
          <p className="text-xs text-slate-500" aria-live="polite">
            {over ? "Time’s up – finish your sentence." : t.running ? "Timer running" : "Paused"}
          </p>
        </div>
        <div className="flex gap-2">
          {t.running ? (
            <button className="btn-secondary" onClick={t.pause} aria-label="Pause timer">
              <Pause className="size-4" aria-hidden />
            </button>
          ) : (
            !over && (
              <button className="btn-secondary" onClick={t.start} aria-label="Start timer">
                <Play className="size-4" aria-hidden />
              </button>
            )
          )}
          <button className="btn-ghost" onClick={() => t.reset()} aria-label="Reset timer">
            <RotateCcw className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExamPage() {
  const prompts = useAsync(() => api.examPrompts(), []);
  const { state, addExamRecord, recordResult, saveAssessment } = useProgress();
  const [step, setStep] = useState<Step>("setup");
  const [prepMin, setPrepMin] = useState("10");
  const [speakMin, setSpeakMin] = useState("5");
  const [chooseMode, setChooseMode] = useState<"one" | "two">("two");
  const [drawn, setDrawn] = useState<SpeakingPromptEx[]>([]);
  const [task, setTask] = useState<SpeakingPromptEx | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [reflection, setReflection] = useState("");
  const [ratings, setRatings] = useState<Record<string, number> | null>(null);

  const questions = useMemo(() => (task ? shuffle(task.follow_up_questions).slice(0, FOLLOW_UP_COUNT) : []), [task]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (prompts.loading) return <LoadingState />;
  if (prompts.error || !prompts.data) return <ErrorState error={prompts.error ?? new Error("No prompts")} onRetry={prompts.retry} />;

  const draw = () => {
    const picks = shuffle(prompts.data!).slice(0, chooseMode === "two" ? 2 : 1);
    setDrawn(picks);
    setRatings(null);
    setReflection("");
    setQIndex(0);
    if (picks.length === 1) {
      setTask(picks[0]);
      setStep("prep");
    } else {
      setStep("choose");
    }
  };

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/25">
          <GraduationCap className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Mini Exam Simulation</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">A full practice run, from preparation to self-evaluation.</p>
        </div>
      </header>

      {stepIdx >= 0 && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Exam progress">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === stepIdx ? "step" : undefined}>
              <div className={cn("h-1.5 rounded-full transition", i <= stepIdx ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-slate-200 dark:bg-white/10")} />
              <p className={cn("mt-1.5 text-xs font-medium", i === stepIdx ? "text-slate-900 dark:text-white" : "text-slate-400")}>{s.label}</p>
            </li>
          ))}
        </ol>
      )}

        <motion.div key={step + (task?.id ?? "")} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
          {step === "setup" && (
            <>
              <div className="flex gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100" role="note">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                <p>
                  <strong>Practice format only.</strong> This is not the official format of the Austrian oral Matura. Timings and procedures in the real exam may differ – ask your teacher for the exact rules at your school.
                </p>
              </div>
              <div className="card space-y-6 p-6">
                <div>
                  <p className="mb-1 font-semibold">How it works</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 marker:text-slate-400 dark:text-slate-400">
                    <li>Draw a random task (or two and choose one).</li>
                    <li>Prepare with a timer. You may take notes.</li>
                    <li>Speak without interruption until the timer ends – out loud, ideally recording yourself.</li>
                    <li>Answer {FOLLOW_UP_COUNT} examiner questions (up to {FOLLOW_UP_SECONDS} seconds each).</li>
                    <li>Assess yourself honestly and compare with the model outline.</li>
                  </ol>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Preparation time</p>
                    <Segmented label="Preparation time" value={prepMin} onChange={setPrepMin} options={["5", "10", "15", "20"].map((v) => ({ value: v, label: `${v} min` }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Speaking time (monologue)</p>
                    <Segmented label="Speaking time" value={speakMin} onChange={setSpeakMin} options={["3", "5", "8"].map((v) => ({ value: v, label: `${v} min` }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Task selection</p>
                    <Segmented
                      label="Task selection"
                      value={chooseMode}
                      onChange={setChooseMode}
                      options={[
                        { value: "two", label: "Draw two, pick one" },
                        { value: "one", label: "Draw one" },
                      ]}
                    />
                  </div>
                </div>
                <button className="btn-primary w-full sm:w-auto" onClick={draw}>
                  <Dices className="size-4" aria-hidden /> Draw {chooseMode === "two" ? "two tasks" : "a task"}
                </button>
              </div>
              {state.examHistory.length > 0 && (
                <div className="card p-5">
                  <p className="mb-3 font-semibold">Your recent simulations</p>
                  <ul className="divide-y divide-slate-100 dark:divide-white/5">
                    {state.examHistory.slice(0, 6).map((r) => (
                      <li key={r.at} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-800 dark:text-slate-200">{r.title}</span>
                          <span className="text-xs text-slate-500">{new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </span>
                        <span className="chip shrink-0 bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">{Math.round(ratingScore(r.ratings) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === "choose" && (
            <>
              <p className="text-slate-600 dark:text-slate-400">Choose the task you feel more confident about. Take no more than a minute to decide.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {drawn.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTask(p);
                      setStep("prep");
                    }}
                    className="card group flex flex-col p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <DifficultyBadge level={p.difficulty} />
                      <span className="text-xs text-slate-500 capitalize">{p.stimulus.kind}</span>
                    </div>
                    <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">{p.title}</p>
                    <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.task}</p>
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                      Choose this task <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </button>
                ))}
              </div>
              <button className="btn-ghost" onClick={() => setStep("setup")}>
                Back to settings
              </button>
            </>
          )}

          {step === "prep" && task && (
            <>
              <PhaseTimer seconds={Number(prepMin) * 60} autoStart tone="indigo" onFinish={() => setStep("speak")} />
              <StimulusCard stimulus={task.stimulus} />
              <TaskCard ex={task} />
              <NotesArea id={`exam-${task.id}`} placeholder="Notes for your talk: key words, structure, examples…" />
              <Collapsible title="Useful phrases">
                <PhrasePanel groups={task.useful_phrases} />
              </Collapsible>
              <button className="btn-primary w-full sm:w-auto" onClick={() => setStep("speak")}>
                <SkipForward className="size-4" aria-hidden /> I’m ready – start speaking
              </button>
            </>
          )}

          {step === "speak" && task && (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100">
                <Mic className="size-5 shrink-0" aria-hidden />
                <p className="text-sm">
                  Speak now, out loud, without stopping. Imagine the examiner is listening. <strong>Tip:</strong> record yourself with your phone’s voice recorder.
                </p>
              </div>
              <PhaseTimer seconds={Number(speakMin) * 60} tone="rose" />
              <TaskCard ex={task} />
              <NotesArea id={`exam-${task.id}`} readOnly />
              <button className="btn-primary w-full sm:w-auto" onClick={() => setStep("followup")}>
                Finish monologue <ArrowRight className="size-4" aria-hidden />
              </button>
            </>
          )}

          {step === "followup" && task && (
            <>
              <p className="text-slate-600 dark:text-slate-400">
                The examiner asks you some questions. Answer each one out loud: give your opinion, a reason and an example.
              </p>
                <motion.div key={qIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="card p-6 sm:p-8">
                    <p className="eyebrow mb-3">
                      Examiner question {qIndex + 1} of {questions.length}
                    </p>
                    <p className="font-display text-2xl leading-snug font-semibold text-slate-900 dark:text-white">“{questions[qIndex]}”</p>
                  </div>
                  <PhaseTimer key={qIndex} seconds={FOLLOW_UP_SECONDS} autoStart tone="sky" />
                </motion.div>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={() => (qIndex + 1 < questions.length ? setQIndex((i) => i + 1) : setStep("evaluate"))}
              >
                {qIndex + 1 < questions.length ? "Next question" : "Go to self-evaluation"} <ArrowRight className="size-4" aria-hidden />
              </button>
            </>
          )}

          {step === "evaluate" && task && (
            <>
              <div className="card p-6">
                <p className="mb-1 font-semibold">How did it go?</p>
                <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Be honest – if you recorded yourself, listen to the recording first.</p>
                <SelfAssessment
                  saveLabel="Save and see summary"
                  onSave={(r) => {
                    setRatings(r);
                    saveAssessment(task.id, r);
                    addExamRecord({ at: new Date().toISOString(), exerciseId: task.id, title: task.title, ratings: r, reflection });
                    recordResult(task, ratingScore(r));
                    setStep("summary");
                  }}
                />
              </div>
              <div className="card p-5">
                <label htmlFor="reflection" className="mb-2 block font-semibold">
                  Reflection (optional)
                </label>
                <textarea id="reflection" className="input min-h-24" placeholder="What went well? What will you do differently next time?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
              </div>
            </>
          )}

          {step === "summary" && task && ratings && (
            <>
              <div className="card p-6 sm:p-8">
                <p className="eyebrow mb-2">Simulation complete</p>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">{task.title}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-5">
                  {ASSESSMENT_CRITERIA.map((c) => (
                    <div key={c.key} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-white/5">
                      <p className="text-xs text-slate-500">{c.label}</p>
                      <p className="mt-1 text-lg font-semibold">{ratings[c.key]}/4</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
                  Your lowest-rated area is <strong>{ASSESSMENT_CRITERIA.reduce((lo, c) => (ratings[c.key] < ratings[lo.key] ? c : lo)).label.toLowerCase()}</strong>. Focus on it in your next practice session.
                </p>
              </div>
              <Collapsible title="Model answer outline – compare with your talk" icon={<ListTree className="size-4 text-rose-500" aria-hidden />} defaultOpen>
                <ModelOutline ex={task} />
              </Collapsible>
              <Collapsible title="All follow-up questions for this task" icon={<Info className="size-4 text-sky-500" aria-hidden />}>
                <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-slate-700 dark:text-slate-300">
                  {task.follow_up_questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </Collapsible>
              <button className="btn-primary" onClick={() => setStep("setup")}>
                <RotateCcw className="size-4" aria-hidden /> New simulation
              </button>
            </>
          )}
        </motion.div>
    </div>
  );
}
