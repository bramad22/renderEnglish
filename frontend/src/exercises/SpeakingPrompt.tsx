import { ClipboardCheck, ListTree, MessageCircleQuestion, Sparkles } from "lucide-react";
import type { SpeakingPromptEx } from "../api/types";
import { NotesArea, PhrasePanel, SelfAssessment, StimulusCard, TimerPanel, ratingScore } from "../components/speaking";
import { Collapsible } from "../components/ui";
import { useProgress } from "../hooks/useProgress";
import type { ExerciseProps } from "./types";

export function TaskCard({ ex }: { ex: SpeakingPromptEx }) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow mb-2">Your task</p>
      <p className="text-[16px] leading-relaxed font-medium text-slate-900 dark:text-white">{ex.task}</p>
      <p className="mt-4 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Cover these points:</p>
      <ul className="space-y-1.5">
        {ex.content_points.map((p) => (
          <li key={p} className="flex gap-2 text-[15px] text-slate-700 dark:text-slate-300">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ModelOutline({ ex }: { ex: SpeakingPromptEx }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">A possible structure with key ideas – not a script. Use your own words and examples.</p>
      <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5 dark:border-white/10">
        {ex.model_outline.map((s) => (
          <li key={s.heading}>
            <span className="absolute -left-[7px] mt-1.5 size-3 rounded-full border-2 border-white bg-rose-500 dark:border-ink-900" aria-hidden />
            <p className="font-semibold text-slate-900 dark:text-white">{s.heading}</p>
            <ul className="mt-1 space-y-0.5">
              {s.points.map((p) => (
                <li key={p} className="text-sm text-slate-600 dark:text-slate-400">
                  – {p}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SpeakingPrompt({ ex, onComplete }: ExerciseProps<SpeakingPromptEx>) {
  const { state, saveAssessment } = useProgress();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <StimulusCard stimulus={ex.stimulus} />
          <TaskCard ex={ex} />
        </div>
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <TimerPanel prepSeconds={ex.prep_seconds} speakSeconds={ex.speak_seconds} />
        </div>
      </div>
      <NotesArea id={ex.id} />
      <Collapsible title="Useful phrases" icon={<Sparkles className="size-4 text-amber-500" aria-hidden />}>
        <PhrasePanel groups={ex.useful_phrases} />
      </Collapsible>
      <Collapsible title="Examiner’s follow-up questions" icon={<MessageCircleQuestion className="size-4 text-sky-500" aria-hidden />}>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Answer each question out loud in 30–60 seconds. Give a reason and an example.</p>
        <ol className="list-decimal space-y-2 pl-5 text-[15px] text-slate-700 marker:text-slate-400 dark:text-slate-300">
          {ex.follow_up_questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </Collapsible>
      <Collapsible title="Model answer outline" icon={<ListTree className="size-4 text-rose-500" aria-hidden />}>
        <ModelOutline ex={ex} />
      </Collapsible>
      <Collapsible title="Self-assessment checklist" icon={<ClipboardCheck className="size-4 text-emerald-500" aria-hidden />} defaultOpen>
        <SelfAssessment
          initial={state.assessments[ex.id]}
          saveLabel="Save and mark as done"
          onSave={(r) => {
            saveAssessment(ex.id, r);
            onComplete(ratingScore(r));
          }}
        />
      </Collapsible>
    </div>
  );
}
