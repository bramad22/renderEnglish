import type {
  Exercise,
  ExerciseSummary,
  Meta,
  SearchHit,
  SectionDetail,
  SectionSummary,
  SpeakingPromptEx,
} from "./types";

// Relative by default (Vite proxies /api to the backend). Override with VITE_API_BASE.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const cache = new Map<string, Promise<unknown>>();

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

/** Content is static while the app runs, so GET responses are cached in memory. */
function cached<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = request<T>(path).catch((err) => {
      cache.delete(path);
      throw err;
    });
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const api = {
  sections: () => cached<SectionSummary[]>("/api/sections"),
  section: (id: string) => cached<SectionDetail>(`/api/sections/${encodeURIComponent(id)}`),
  exercise: (id: string) => cached<Exercise>(`/api/exercises/${encodeURIComponent(id)}`),
  exercises: () => cached<ExerciseSummary[]>("/api/exercises"),
  search: (q: string) => request<SearchHit[]>(`/api/search?q=${encodeURIComponent(q)}`),
  examPrompts: () => cached<SpeakingPromptEx[]>("/api/exam/prompts"),
  meta: () => cached<Meta>("/api/meta"),
};
