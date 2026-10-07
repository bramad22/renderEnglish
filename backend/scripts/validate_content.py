"""Validate every content file. Run: python -m scripts.validate_content (from /backend).

Prints a per-section summary and exits with code 1 if anything is wrong.
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.content_loader import ContentError, load_content  # noqa: E402
from app.models import AUTO_CHECKED_TYPES  # noqa: E402


def check_extra_rules(store) -> list[str]:
    """Rules that are easier to express here than in the Pydantic models."""
    problems: list[str] = []
    for ex in store.exercises.values():
        for field_name in ("id", "section", "type", "instruction", "difficulty"):
            if not getattr(ex, field_name, None):
                problems.append(f"{ex.id}: missing '{field_name}'")
        # Every auto-checked exercise must explain its answers somewhere.
        if ex.type in AUTO_CHECKED_TYPES:
            has_expl = bool(getattr(ex, "explanation", None))
            for coll in ("questions", "statements", "items"):
                for item in getattr(ex, coll, []) or []:
                    if isinstance(item, str):
                        continue
                    if getattr(item, "explanation", None):
                        has_expl = True
            if not has_expl:
                problems.append(f"{ex.id}: auto-checked exercise without any explanation")
        if ex.type == "multiple_choice":
            for q in ex.questions:
                if any(not o.strip() for o in q.options):
                    problems.append(f"{ex.id}: empty option")
    return problems


def main() -> int:
    try:
        store = load_content()
    except ContentError as exc:
        print(f"CONTENT ERROR: {exc}")
        return 1

    problems = check_extra_rules(store)
    total = 0
    for s in store.sections:
        counts = Counter(e.difficulty for e in s.exercises)
        total += len(s.exercises)
        print(f"{s.order:>2}. {s.title:<32} {len(s.exercises):>3} exercises  {dict(counts)}")
    print(f"Total: {total} exercises, {len(store.meta.sources)} sources")

    for p in problems:
        print("PROBLEM:", p)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
