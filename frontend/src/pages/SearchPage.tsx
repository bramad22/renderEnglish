import { BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Difficulty, ExerciseSummary, SearchHit } from "../api/types";
import { DifficultyBadge, ErrorState, Segmented } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { ExerciseRow } from "./SectionPage";

type Filter = "all" | Difficulty;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "Challenge", label: "★ Challenge" },
];

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-400/30">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(query);
  const [filter, setFilter] = useState<Filter>("all");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const all = useAsync(() => api.exercises(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
    if (debounced.length < 2) {
      setHits([]);
      return;
    }
    let alive = true;
    api
      .search(debounced)
      .then((h) => alive && (setHits(h), setError(null)))
      .catch((e: Error) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, [debounced, setParams]);

  const filtered = hits.filter((h) => filter === "all" || h.difficulty === filter);
  const exerciseHits = filtered.filter((h) => h.kind === "exercise");
  const vocabHits = filtered.filter((h) => h.kind === "vocabulary");

  const browse = useMemo<ExerciseSummary[]>(
    () => (all.data ?? []).filter((e) => filter !== "all" && e.difficulty === filter),
    [all.data, filter],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Search</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Find exercises, texts and vocabulary across all sections.</p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <label htmlFor="search" className="sr-only">
          Search exercises and vocabulary
        </label>
        <input
          id="search"
          ref={inputRef}
          type="search"
          className="input h-14 rounded-2xl pr-12 pl-12 text-base shadow-soft"
          placeholder="e.g. misinformation, collocations, GDPR…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button className="btn-ghost absolute top-1/2 right-2 size-10 min-h-10 -translate-y-1/2 rounded-full p-0" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
      </div>

      <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Filter by difficulty" />

      {error && <ErrorState error={error} />}

      {debounced.length < 2 ? (
        <div className="space-y-5">
          {filter !== "all" && (
            <div>
              <p className="eyebrow mb-2">All {filter} exercises ({browse.length})</p>
              <ul className="grid gap-3">
                {browse.map((e) => (
                  <li key={e.id}>
                    <ExerciseRow ex={e} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6" aria-live="polite">
          <p className="text-sm text-slate-500">
            {filtered.length} result{filtered.length === 1 ? "" : "s"} for “{debounced}”
          </p>
          {exerciseHits.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2">Exercises</h2>
              <ul className="grid gap-2">
                {exerciseHits.map((h) => (
                  <li key={h.exercise_id}>
                    <Link to={`/exercise/${h.exercise_id}`} className="card block p-4 transition hover:shadow-lift">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          <Highlight text={h.title} q={debounced} />
                        </p>
                        <DifficultyBadge level={h.difficulty} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                        <Highlight text={h.snippet} q={debounced} />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {vocabHits.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2">Vocabulary</h2>
              <ul className="card divide-y divide-slate-100 dark:divide-white/5">
                {vocabHits.map((h, i) => (
                  <li key={`${h.exercise_id}-${i}`}>
                    <Link to={`/exercise/${h.exercise_id}`} className="flex items-start gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-white/5">
                      <BookOpen className="mt-0.5 size-4 shrink-0 text-violet-500" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-800 dark:text-slate-200">
                          <Highlight text={h.snippet} q={debounced} />
                        </span>
                        <span className="block text-xs text-slate-500">in “{h.title}”</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {filtered.length === 0 && <div className="card p-8 text-center text-slate-500">No results. Try a different word or remove the level filter.</div>}
        </div>
      )}
    </div>
  );
}
