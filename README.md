# Matura Trainer: Communication and Media

A training app for the Austrian oral Matura in English (year 13, B2–C1), focused on the topic **Communication and Media**. 100 exercises in 8 practice areas, plus a Sources & AI usage page. Works fully offline: no accounts, no API keys, no external AI. Progress is stored in the browser.

| Area | Exercises | Formats |
|---|---|---|
| Key Facts & Background | 14 | input texts + multiple choice, true/false/not given, headline matching, short answers |
| Vocabulary | 14 | flashcards, collocation/phrasal-verb/idiom matching, sorting, word families, context choice |
| Speaking Prompts | 12 | stimulus, two-phase timer, notes, useful phrases, follow-up questions, model outline, self-assessment |
| Discussion & Arguments | 12 | debate cards (for/against + counter-arguments), hedging, fallacies, counter-argument matching |
| Role-plays & Dilemmas | 13 | hidden role cards, ethical dilemmas with perspectives and model answers |
| Language Workshop | 12 | error correction (German-speaker mistakes), register upgrade, paraphrasing, linking, C1 transformations |
| Quiz & Games | 11 | timed quizzes with high scores, fact or myth, matching, timeline, odd one out |
| Mini Exam Simulation | 12 | random task → preparation timer → speaking timer → examiner questions → self-evaluation |

## Requirements

- Python 3.11+ (tested with 3.13)
- Node.js 20+ (tested with 22)

## Quick start with Docker (easiest)

Requires Docker Desktop (or Docker Engine with the Compose plugin). From this folder:

```bash
docker compose up -d
```

Then open <http://localhost:8080>. The first run builds the images (about a minute); later starts take seconds.

```bash
docker compose down                 # stop and remove the containers
docker compose up -d --build        # rebuild after you changed code
docker compose restart backend      # pick up edits to backend/content/*.json (no rebuild needed)
docker compose logs -f              # watch the logs
WEB_PORT=3000 docker compose up -d  # use another port (PowerShell: $env:WEB_PORT=3000; docker compose up -d)
```

Two containers run: `web` (nginx serving the built React app and forwarding `/api` to the backend) and `backend` (FastAPI, not exposed to the host). Progress is stored in your browser, so it survives `docker compose down`, but it is tied to the address (`localhost:8080`) you use.

## Running without Docker (development)

### 1. Backend (FastAPI, port 8000)

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check it: <http://localhost:8000/api/health> · interactive API docs: <http://localhost:8000/docs>

### 2. Frontend (React + Vite, port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite forwards every `/api` request to the backend, so both servers must be running.

**Ports already in use?** Start the backend on another port and tell Vite where it is:

```powershell
uvicorn app.main:app --port 8001          # in backend/
$env:BACKEND_PORT="8001"; npm run dev -- --port 5174   # in frontend/ (PowerShell)
```

```bash
BACKEND_PORT=8001 npm run dev -- --port 5174           # in frontend/ (macOS / Linux)
```

**On a phone in the same Wi-Fi:** run `npm run dev -- --host` and open the "Network" URL that Vite prints.

## Tests and content validation

```bash
cd backend
python -m pytest              # API tests + content schema/quality checks
python -m scripts.validate_content   # per-section summary of all content
```

The validator checks that every exercise has an id, section, type, instruction, difficulty and (for auto-checked types) an explanation; that answer indices are valid; that every sorting item has an existing category; that error-correction errors appear in their sentence; that ids are unique; and that each section has at least 10 exercises.

Production build of the frontend:

```bash
cd frontend
npm run build      # type-checks and writes dist/
npm run preview    # serves dist/ on port 4173 (backend must run on 8000)
```

## Editing content

All learning content is in `backend/content/`, one JSON file per section (`01_key_facts.json` … `08_exam_simulation.json`) plus `meta.json` for the Sources & AI page. Edit a file, run `python -m scripts.validate_content`, and restart the backend. The schema for each exercise type is defined in `backend/app/models.py`.

## AI usage

AI was used to brainstorm and generate initial exercises. All tasks should be checked, edited and adapted by the students before use.
