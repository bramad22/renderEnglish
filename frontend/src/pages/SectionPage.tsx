import { motion } from "framer-motion";
import { ArrowLeft, CircleCheck, Clock, Library } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Difficulty, ExerciseSummary } from "../api/types";
import { DifficultyBadge, ErrorState, LoadingState, ProgressBar, Segmented } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useProgress } from "../hooks/useProgress";
import { SECTION_ICONS, TYPE_INFO, accent } from "../lib/theme";
import { cn } from "../lib/utils";

type Filter = "all" | Difficulty;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "Challenge", label: "★ Challenge" },
];

export function SectionPage() {
  const { id = "" } = useParams();
  const { data, error, loading, retry } = useAsync(() => api.section(id), [id]);
  const { state } = useProgress();
  const [filter, setFilter] = useState<Filter>("all");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error ?? new Error("Not found")} onRetry={retry} />;

  const a = accent(data.accent);
  const Icon = SECTION_ICONS[data.icon] ?? Library;
  const done = data.exercises.filter((e) => state.exercises[e.id]?.completed).length;
  const shown = data.exercises.filter((e) => filter === "all" || e.difficulty === filter);

  return (
    <div className="space-y-6">
      <Link to="/" className="btn-ghost -ml-3 min-h-9 px-3 text-sm">
        <ArrowLeft className="size-4" aria-hidden /> All areas
      </Link>

      <header className="card relative overflow-hidden p-6 sm:p-8">
        <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", a.gradient)} aria-hidden />
        <div className="flex items-start gap-4">
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md", a.gradient)}>
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-tight font-semibold text-slate-900 sm:text-3xl dark:text-white">{data.title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{data.intro}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <ProgressBar value={done / data.exercise_count} barClass={a.bar} label={`${done} of ${data.exercise_count} completed`} />
          <span className="shrink-0 text-sm font-medium text-slate-600 tabular-nums dark:text-slate-300">
            {done}/{data.exercise_count}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Filter by difficulty" />
        <p className="text-sm text-slate-500" aria-live="polite">
          {shown.length} exercise{shown.length === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="grid gap-3">
        {shown.map((ex, i) => (
          <motion.li key={ex.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
            <ExerciseRow ex={ex} index={data.exercises.indexOf(ex) + 1} />
          </motion.li>
        ))}
        {shown.length === 0 && <li className="card p-6 text-center text-sm text-slate-500">No exercises at this level in this section.</li>}
      </ul>
    </div>
  );
}

export function ExerciseRow({ ex, index }: { ex: ExerciseSummary; index?: number }) {
  const { state } = useProgress();
  const p = state.exercises[ex.id];
  const info = TYPE_INFO[ex.type];
  return (
    <Link to={`/exercise/${ex.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold",
          p?.completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
        )}
        aria-label={p?.completed ? "Completed" : undefined}
      >
        {p?.completed ? <CircleCheck className="size-5" aria-hidden /> : (index ?? <info.icon className="size-4" aria-hidden />)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{ex.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <info.icon className="size-3.5" aria-hidden /> {info.label}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {ex.estimated_minutes} min
          </span>
          {p?.bestScore !== undefined && !info.selfChecked && <span className="font-medium text-emerald-600 dark:text-emerald-400">Best: {Math.round(p.bestScore * 100)}%</span>}
        </p>
      </div>
      <DifficultyBadge level={ex.difficulty} />
    </Link>
  );
}
