"""Very small in-memory full-text search across exercises and vocabulary."""

from __future__ import annotations

from .content_loader import ContentStore
from .models import SearchHit

SNIPPET_RADIUS = 60


def _snippet(text: str, query: str) -> str:
    idx = text.lower().find(query)
    if idx < 0:
        return text[: SNIPPET_RADIUS * 2]
    start = max(0, idx - SNIPPET_RADIUS)
    end = min(len(text), idx + len(query) + SNIPPET_RADIUS)
    return ("…" if start else "") + text[start:end] + ("…" if end < len(text) else "")


def _vocabulary_entries(ex) -> list[str]:
    """Term-like strings inside an exercise that a student might look up."""
    entries: list[str] = []
    if ex.type == "flashcards":
        entries += [f"{c.term}: {c.definition}" for c in ex.cards]
    elif ex.type == "matching":
        entries += [f"{p.left} – {p.right}" for p in ex.pairs]
    elif ex.type == "sorting":
        entries += [i.text for i in ex.items]
    return entries


def _exercise_text(ex) -> str:
    parts = [ex.title, ex.instruction, " ".join(ex.tags)]
    if ex.input_text:
        parts.append(ex.input_text.title)
        parts += ex.input_text.paragraphs
    for attr in ("task", "motion", "situation", "case", "context"):
        if hasattr(ex, attr):
            parts.append(getattr(ex, attr))
    if hasattr(ex, "stimulus"):
        parts += [ex.stimulus.title, ex.stimulus.content]
    return " ".join(parts)


def search(store: ContentStore, query: str, limit: int = 40) -> list[SearchHit]:
    q = query.strip().lower()
    if len(q) < 2:
        return []

    hits: list[SearchHit] = []
    vocab_hits: list[SearchHit] = []
    for section in store.sections:
        for ex in section.exercises:
            base = dict(exercise_id=ex.id, section=section.id, title=ex.title, difficulty=ex.difficulty)
            text = _exercise_text(ex)
            if q in text.lower():
                hits.append(SearchHit(kind="exercise", snippet=_snippet(text, q), **base))
            for entry in _vocabulary_entries(ex):
                if q in entry.lower():
                    vocab_hits.append(SearchHit(kind="vocabulary", snippet=entry, **base))

    # Title matches first, then other exercise hits, then vocabulary entries.
    hits.sort(key=lambda h: q not in h.title.lower())
    return (hits + vocab_hits)[:limit]
