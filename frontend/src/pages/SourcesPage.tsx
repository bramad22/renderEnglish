import { Bot, ExternalLink, Library, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { ErrorState, LoadingState } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useProgress } from "../hooks/useProgress";

export function SourcesPage() {
  const { data, error, loading, retry } = useAsync(() => api.meta(), []);
  const { reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error ?? new Error("No data")} onRetry={retry} />;

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-md">
          <Library className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Sources & AI Usage</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Where the content comes from, how AI was used, and how to get the most out of this app.</p>
        </div>
      </header>

      <section aria-labelledby="ai-title" className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:border-indigo-400/20 dark:from-indigo-500/10 dark:to-violet-500/10">
        <h2 id="ai-title" className="mb-2 flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
          <Bot className="size-5" aria-hidden /> AI usage statement
        </h2>
        <p className="font-display text-xl leading-snug text-slate-900 dark:text-white">{data.ai_statement}</p>
      </section>

      <section aria-labelledby="howto-title">
        <h2 id="howto-title" className="mb-4 font-display text-2xl font-semibold text-slate-900 dark:text-white">
          How to use this app for exam prep
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {data.how_to_use.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{i + 1}</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{s.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100" role="note">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <p>{data.exam_note}</p>
      </div>

      <section aria-labelledby="sources-title">
        <h2 id="sources-title" className="mb-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Sources
        </h2>
        <p className="mb-4 flex gap-2 text-sm text-slate-600 dark:text-slate-400">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          {data.verify_note}
        </p>
        <ul className="card divide-y divide-slate-100 dark:divide-white/5">
          {data.sources.map((s) => (
            <li key={s.name} className="p-4 sm:p-5">
              <p className="font-medium text-slate-900 dark:text-white">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline decoration-slate-300 underline-offset-4 hover:decoration-indigo-500 dark:decoration-slate-600">
                    {s.name} <ExternalLink className="size-3.5 shrink-0" aria-label="(opens in a new tab)" />
                  </a>
                ) : (
                  s.name
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.publisher}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">Used for:</span> {s.used_for}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="data-title" className="card p-5">
        <h2 id="data-title" className="font-semibold text-slate-900 dark:text-white">
          Your data
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Progress, notes, scores and streaks are stored only in this browser (localStorage). Nothing is sent to a server, and there is no login.
        </p>
        {confirming ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Delete all progress on this device?</span>
            <button
              className="btn min-h-10 bg-rose-600 text-white hover:bg-rose-500"
              onClick={() => {
                reset();
                setConfirming(false);
              }}
            >
              Yes, reset
            </button>
            <button className="btn-ghost min-h-10" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-secondary mt-4" onClick={() => setConfirming(true)}>
            <Trash2 className="size-4" aria-hidden /> Reset my progress
          </button>
        )}
      </section>
    </div>
  );
}
