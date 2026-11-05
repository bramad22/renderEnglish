import { motion } from "framer-motion";
import { ArrowRight, Flame, History, Library, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { SectionSummary } from "../api/types";
import { ErrorState, LoadingState, ProgressRing } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useProgress } from "../hooks/useProgress";
import { dailySuggestion } from "../lib/daily";
import { SECTION_ICONS, accent } from "../lib/theme";
import { cn } from "../lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function HomePage() {
  const sections = useAsync(() => Promise.all([api.sections(), api.exercises()]), []);
  const { state, streak, sectionCompleted } = useProgress();

  if (sections.loading) return <LoadingState />;
  if (sections.error || !sections.data) return <ErrorState error={sections.error ?? new Error("No data")} onRetry={sections.retry} />;

  const [secs, all] = sections.data;
  const total = all.length;
  const done = all.filter((e) => state.exercises[e.id]?.completed).length;
  const suggestion = dailySuggestion(all, state);
  const sectionById = Object.fromEntries(secs.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-600/20 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-fuchsia-300/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <p className="text-sm font-medium text-white/75">{greeting()} 👋</p>
            <h1 className="mt-1 font-display text-3xl leading-tight font-semibold sm:text-4xl">Ready for your oral Matura?</h1>
            <p className="mt-2 text-[15px] text-white/80">
              Practise <strong className="font-semibold text-white">Vocabulary and Speaking</strong> at B2–C1 level: read, analyse, argue and speak.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="chip bg-white/15 py-1.5 text-white backdrop-blur">
                <Flame className="size-3.5" aria-hidden /> {streak} day streak
              </span>
              <span className="chip bg-white/15 py-1.5 text-white backdrop-blur">
                <Sparkles className="size-3.5" aria-hidden /> {total} exercises
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <ProgressRing value={total ? done / total : 0} size={84} stroke={8} colorClass="stroke-white" label={`Overall progress: ${done} of ${total} exercises completed`}>
              <span className="text-base text-white">{total ? Math.round((done / total) * 100) : 0}%</span>
            </ProgressRing>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {done}
                <span className="text-base text-white/70">/{total}</span>
              </p>
              <p className="text-sm text-white/75">completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue + daily */}
      <section className="grid gap-4 md:grid-cols-1" aria-label="Quick start">
        <QuickCard
          icon={<History className="size-4" aria-hidden />}
          eyebrow="Continue where you left off"
          to={state.lastVisited ? `/exercise/${state.lastVisited.id}` : suggestion ? `/exercise/${suggestion.id}` : "/"}
          title={state.lastVisited?.title ?? "Start your first exercise"}
          meta={state.lastVisited ? sectionById[state.lastVisited.section]?.title : "We suggest beginning with Key Facts."}
        />
      </section>

      {/* Sections */}
      <section aria-labelledby="sections-title">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="sections-title" className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Practice areas
          </h2>
          <Link to="/search" className="btn-ghost min-h-9 px-3 text-sm">
            <Search className="size-4" aria-hidden /> Search all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {secs.map((s, i) => (
            <SectionCard key={s.id} section={s} completed={sectionCompleted(s.id)} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickCard({ icon, eyebrow, to, title, meta }: { icon: ReactNode; eyebrow: string; to: string; title: string; meta?: string }) {
  return (
    <Link to={to} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="min-w-0 flex-1">
        <p className="eyebrow mb-1.5 flex items-center gap-1.5">
          {icon} {eyebrow}
        </p>
        <p className="truncate font-semibold text-slate-900 dark:text-white">{title}</p>
        {meta && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{meta}</p>}
      </div>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-white/5">
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

function SectionCard({ section, completed, index }: { section: SectionSummary; completed: number; index: number }) {
  const Icon = SECTION_ICONS[section.icon] ?? Library;
  const a = accent(section.accent);
  const value = section.exercise_count ? completed / section.exercise_count : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link to={`/section/${section.id}`} className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        <div className="mb-4 flex items-start justify-between">
          <span className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", a.gradient)}>
            <Icon className="size-5" aria-hidden />
          </span>
          <ProgressRing value={value} size={44} stroke={4.5} colorClass={a.ring} label={`${section.title}: ${completed} of ${section.exercise_count} completed`}>
            <span className="text-[10px]">{Math.round(value * 100)}%</span>
          </ProgressRing>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">{section.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{section.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {completed}/{section.exercise_count} done · ~{Math.round(section.total_minutes / 5) * 5} min
          </span>
          <ArrowRight className={cn("size-4 transition group-hover:translate-x-0.5", a.text)} aria-hidden />
        </div>
      </Link>
    </motion.div>
  );
}
