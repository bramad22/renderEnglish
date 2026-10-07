import { ArrowLeft, ArrowRight, CircleCheck, Clock } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Exercise, SectionDetail } from "../api/types";
import { DifficultyBadge, ErrorState, InputTextCard, LoadingState } from "../components/ui";
import { ExerciseRenderer } from "../exercises/ExerciseRenderer";
import { useAsync } from "../hooks/useAsync";
import { useProgress } from "../hooks/useProgress";
import { TYPE_INFO, accent } from "../lib/theme";
import { cn } from "../lib/utils";

export function ExercisePage() {
  const { id = "" } = useParams();
  const { data, error, loading, retry } = useAsync(
    async () => {
      const ex = await api.exercise(id);
      const section = await api.section(ex.section);
      return { ex, section };
    },
    [id],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error ?? new Error("Not found")} onRetry={retry} />;
  // key={id} resets all exercise state when navigating between exercises
  return <ExerciseView key={id} ex={data.ex} section={data.section} />;
}

function ExerciseView({ ex, section }: { ex: Exercise; section: SectionDetail }) {
  const { state, recordResult, markVisited } = useProgress();
  const progress = state.exercises[ex.id];
  const info = TYPE_INFO[ex.type];
  const a = accent(section.accent);

  useEffect(() => {
    markVisited({ id: ex.id, section: ex.section, title: ex.title });
    document.title = `${ex.title} · Matura Trainer`;
    return () => {
      document.title = "Matura Trainer · Communication and Media";
    };
  }, [ex, markVisited]);

  const onComplete = useCallback((score: number | null) => recordResult(ex, score), [ex, recordResult]);

  const idx = section.exercises.findIndex((e) => e.id === ex.id);
  const prev = section.exercises[idx - 1];
  const next = section.exercises[idx + 1];

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        <Link to={`/section/${section.id}`} className="btn-ghost -ml-3 min-h-9 px-3">
          <ArrowLeft className="size-4" aria-hidden /> {section.title}
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge level={ex.difficulty} />
          <span className={cn("chip", a.soft, a.text)}>
            <info.icon className="size-3.5" aria-hidden /> {info.label}
          </span>
          <span className="chip bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <Clock className="size-3.5" aria-hidden /> ~{ex.estimated_minutes} min
          </span>
          {progress?.completed && (
            <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CircleCheck className="size-3.5" aria-hidden /> Done
              {progress.bestScore !== undefined && !info.selfChecked && ` · best ${Math.round(progress.bestScore * 100)}%`}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl leading-tight font-semibold text-slate-900 sm:text-3xl dark:text-white">{ex.title}</h1>
        <p className="max-w-3xl text-[15.5px] leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Instructions: </span>
          {ex.instruction}
        </p>
      </header>

      {ex.input_text && <InputTextCard text={ex.input_text} />}

      <ExerciseRenderer ex={ex} onComplete={onComplete} />

      <nav aria-label="Exercise navigation" className="grid grid-cols-2 gap-3 pt-4">
        {prev ? (
          <Link to={`/exercise/${prev.id}`} className="card flex items-center gap-2 p-4 text-sm transition hover:shadow-lift">
            <ArrowLeft className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">Previous</span>
              <span className="block truncate font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/exercise/${next.id}`} className="card flex items-center justify-end gap-2 p-4 text-right text-sm transition hover:shadow-lift">
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">Next</span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden />
          </Link>
        ) : (
          <Link to={`/section/${section.id}`} className="card flex items-center justify-end gap-2 p-4 text-right text-sm transition hover:shadow-lift">
            <span>
              <span className="block text-xs text-slate-500">End of section</span>
              <span className="block font-medium">Back to overview</span>
            </span>
            <ArrowRight className="size-4 text-slate-400" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}
