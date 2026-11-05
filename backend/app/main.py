"""FastAPI entry point: serves the learning content as a read-only REST API."""

from __future__ import annotations

from collections import Counter
from contextlib import asynccontextmanager
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .content_loader import ContentStore, load_content
from .models import Difficulty, ExerciseSummary, Meta, SearchHit, Section, SectionDetail, SectionSummary
from .search import search

EXAM_SECTION_ID = "exam-simulation"


@lru_cache(maxsize=1)
def get_store() -> ContentStore:
    return load_content()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_store()  # fail fast if any content file is invalid
    yield


app = FastAPI(title="Matura Trainer API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "https://renderenglish.onrender.com", "https://renderenglish-1.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _summary(ex) -> ExerciseSummary:
    return ExerciseSummary(
        id=ex.id,
        section=ex.section,
        type=ex.type,
        title=ex.title,
        difficulty=ex.difficulty,
        estimated_minutes=ex.estimated_minutes,
        tags=ex.tags,
    )


def _section_summary(s: Section) -> dict:
    return dict(
        id=s.id,
        order=s.order,
        title=s.title,
        short_title=s.short_title,
        description=s.description,
        icon=s.icon,
        accent=s.accent,
        exercise_count=len(s.exercises),
        difficulty_counts=dict(Counter(e.difficulty for e in s.exercises)),
        total_minutes=sum(e.estimated_minutes for e in s.exercises),
    )


@app.get("/api/health")
def health() -> dict:
    store = get_store()
    return {"status": "ok", "sections": len(store.sections), "exercises": len(store.exercises)}


@app.get("/api/sections", response_model=list[SectionSummary])
def list_sections():
    return [SectionSummary(**_section_summary(s)) for s in get_store().sections]


@app.get("/api/sections/{section_id}", response_model=SectionDetail)
def get_section(section_id: str):
    section = get_store().section(section_id)
    if section is None:
        raise HTTPException(status_code=404, detail=f"Section '{section_id}' not found")
    return SectionDetail(
        **_section_summary(section),
        intro=section.intro,
        exercises=[_summary(e) for e in section.exercises],
    )


@app.get("/api/exercises", response_model=list[ExerciseSummary])
def list_exercises(
    difficulty: Difficulty | None = None,
    type: str | None = None,
    section: str | None = None,
):
    result = []
    for ex in get_store().exercises.values():
        if difficulty and ex.difficulty != difficulty:
            continue
        if type and ex.type != type:
            continue
        if section and ex.section != section:
            continue
        result.append(_summary(ex))
    return result


@app.get("/api/exercises/{exercise_id}")
def get_exercise(exercise_id: str):
    ex = get_store().exercises.get(exercise_id)
    if ex is None:
        raise HTTPException(status_code=404, detail=f"Exercise '{exercise_id}' not found")
    return ex.model_dump()


@app.get("/api/search", response_model=list[SearchHit])
def search_content(q: str = Query(..., min_length=1, max_length=80)):
    return search(get_store(), q)


@app.get("/api/exam/prompts")
def exam_prompts():
    section = get_store().section(EXAM_SECTION_ID)
    if section is None:
        return []
    return [e.model_dump() for e in section.exercises if e.type == "speaking_prompt"]


@app.get("/api/meta", response_model=Meta)
def meta():
    return get_store().meta
