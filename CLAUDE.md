# CLAUDE.md

Training app for the Austrian oral Matura in English, topic "Communication and Media" (B2–C1). Source brief: `docs/Final_Exam_Study_Material_Challenge_newDESIGN.docx`.

## Architecture

```
frontend (React 19 + TS + Vite, :5173)  --/api proxy-->  backend (FastAPI, :8000)
  progress in localStorage                                  content from backend/content/*.json
```

- **Backend** (`backend/app/`): read-only REST API. `models.py` defines the content schema (Pydantic v2, discriminated union on `type`). `content_loader.py` loads and validates every JSON file once (`lru_cache`), fails fast on invalid content. `search.py` is a simple in-memory substring search. `main.py` holds the routes.
- **Content** (`backend/content/`): `NN_<name>.json` = one section (`order` field sets display order); `meta.json` = sources, AI statement, how-to guide, exam note. Section 8 (`exam-simulation`) supplies the prompts for `/api/exam/prompts`.
- **Frontend** (`frontend/src/`):
  - `api/` – `types.ts` mirrors `models.py` (keep in sync!), `client.ts` caches GET responses in memory.
  - `exercises/` – one renderer per exercise type; `ExerciseRenderer.tsx` switches on `type`. Each gets `{ ex, onComplete(score | null) }`.
  - `components/` – `ui.tsx` (primitives), `speaking.tsx` (stimulus, timer, notes, self-assessment), `Layout.tsx`, `ErrorBoundary.tsx`.
  - `hooks/useProgress.tsx` – the only place that touches progress storage (`mt-progress-v1`). `useCountdown` is wall-clock based.
  - `pages/` – Home (dashboard), Section, Exercise, Search, Exam, Sources. Heavy pages are lazy-loaded in `App.tsx`.

## API

`GET /api/health` · `/api/sections` · `/api/sections/{id}` (summaries, no solutions) · `/api/exercises?difficulty=&type=&section=` · `/api/exercises/{id}` (full payload) · `/api/search?q=` · `/api/exam/prompts` · `/api/meta`

## Adding an exercise type

1. Add a Pydantic model in `models.py`, include it in the `Exercise` union (and `AUTO_CHECKED_TYPES` if it has a right answer).
2. Mirror it in `frontend/src/api/types.ts` and add an entry to `TYPE_INFO` in `lib/theme.ts`.
3. Write the renderer in `frontend/src/exercises/` and add a `case` to `ExerciseRenderer.tsx`.

## Conventions

- Content: natural B2–C1 English, British spelling. No invented statistics, quotes or studies; anything with a number must be backed by an entry in `meta.json`. Invented stimuli are labelled “(invented)”. Every auto-checked item needs an explanation. Use “they” for people of unknown gender. Typographic quotes (“ ”, ’) inside JSON strings avoid escaping.
- Difficulty is exactly `B2`, `C1` or `Challenge`; each section needs ≥ 10 exercises and at least one C1/Challenge task.
- Frontend: Tailwind v4 (CSS-first config in `index.css`, custom utilities via `@utility`, dark mode via `.dark` class). Accent colours are mapped to full class strings in `lib/theme.ts` – never build Tailwind class names dynamically.
- Animations: Framer Motion with `MotionConfig reducedMotion="user"`. Avoid `AnimatePresence mode="wait"` for content that must appear immediately (it blocks when the page isn't painting).
- `useEffect` callbacks must have block bodies – e.g. smooth `window.scrollTo` returns a Promise in current Chromium, which React would treat as a cleanup function and crash.
- Accessibility: every interactive control is a real `<button>`/`<input>`/`<select>` with a label; feedback uses `role="status"`/`aria-live`.
- No external network calls at runtime (fonts are bundled via `@fontsource`).

## Commands

```bash
cd backend && python -m pytest                    # tests incl. content validation
cd backend && python -m scripts.validate_content  # content summary
cd frontend && npm run build                      # type-check + production build
```
