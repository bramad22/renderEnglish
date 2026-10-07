"""Loads and validates all JSON content files once at startup."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import TypeAdapter

from .models import Meta, Section

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
MIN_EXERCISES_PER_SECTION = 10


class ContentError(Exception):
    pass


@dataclass
class ContentStore:
    sections: list[Section]
    meta: Meta
    exercises: dict = field(default_factory=dict)  # id -> exercise model

    def section(self, section_id: str) -> Section | None:
        return next((s for s in self.sections if s.id == section_id), None)


def _read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ContentError(f"{path.name}: invalid JSON ({exc})") from exc


def load_content(content_dir: Path = CONTENT_DIR) -> ContentStore:
    """Parse every section file (NN_name.json) and meta.json, then run cross-file checks."""
    section_files = sorted(p for p in content_dir.glob("*.json") if p.name[:2].isdigit())
    if not section_files:
        raise ContentError(f"no section files found in {content_dir}")

    adapter = TypeAdapter(Section)
    sections: list[Section] = []
    for path in section_files:
        try:
            sections.append(adapter.validate_python(_read_json(path)))
        except ContentError:
            raise
        except Exception as exc:  # pydantic ValidationError, keep file name in message
            raise ContentError(f"{path.name}: {exc}") from exc

    meta_path = content_dir / "meta.json"
    if not meta_path.exists():
        raise ContentError("meta.json is missing")
    meta = Meta.model_validate(_read_json(meta_path))

    exercises: dict = {}
    for section in sections:
        if len(section.exercises) < MIN_EXERCISES_PER_SECTION:
            raise ContentError(
                f"section '{section.id}' has {len(section.exercises)} exercises "
                f"(minimum {MIN_EXERCISES_PER_SECTION})"
            )
        for ex in section.exercises:
            if ex.id in exercises:
                raise ContentError(f"duplicate exercise id '{ex.id}'")
            exercises[ex.id] = ex

    ids = [s.id for s in sections]
    if len(set(ids)) != len(ids):
        raise ContentError("duplicate section ids")

    sections.sort(key=lambda s: s.order)
    return ContentStore(sections=sections, meta=meta, exercises=exercises)
