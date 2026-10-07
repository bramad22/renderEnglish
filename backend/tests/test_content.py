"""Content quality gate: every content file must pass the schema and the extra rules."""

import json

import pytest

from app.content_loader import CONTENT_DIR, MIN_EXERCISES_PER_SECTION, ContentError, load_content
from app.models import AUTO_CHECKED_TYPES
from scripts.validate_content import check_extra_rules

REQUIRED_SECTIONS = {
    "key-facts",
    "vocabulary",
    "speaking",
    "discussion",
    "roleplays",
    "language-workshop",
    "quiz",
    "exam-simulation",
}


@pytest.fixture(scope="module")
def store():
    return load_content()


def test_all_content_loads(store):
    assert store.sections


def test_required_sections_exist(store):
    assert REQUIRED_SECTIONS <= {s.id for s in store.sections}


@pytest.mark.parametrize("section_id", sorted(REQUIRED_SECTIONS))
def test_minimum_exercises_per_section(store, section_id):
    section = store.section(section_id)
    assert len(section.exercises) >= MIN_EXERCISES_PER_SECTION


def test_every_exercise_has_core_fields(store):
    for ex in store.exercises.values():
        for field in ("id", "section", "type", "instruction", "difficulty"):
            assert getattr(ex, field), f"{ex.id} missing {field}"
        assert ex.difficulty in {"B2", "C1", "Challenge"}


def test_auto_checked_exercises_have_explanations(store):
    assert check_extra_rules(store) == []
    assert any(ex.type in AUTO_CHECKED_TYPES for ex in store.exercises.values())


def test_every_section_offers_some_challenge(store):
    for s in store.sections:
        assert any(e.difficulty in {"C1", "Challenge"} for e in s.exercises), s.id


def test_exam_section_has_speaking_prompts(store):
    prompts = [e for e in store.section("exam-simulation").exercises if e.type == "speaking_prompt"]
    assert len(prompts) >= 10


def test_meta_contains_required_ai_statement(store):
    assert store.meta.ai_statement == (
        "AI was used to brainstorm and generate initial exercises. "
        "All tasks should be checked, edited and adapted by the students before use."
    )


def test_loader_rejects_bad_answer_index(tmp_path):
    """The validator must catch a multiple-choice answer that points nowhere."""
    for f in CONTENT_DIR.glob("*.json"):
        (tmp_path / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")
    target = next(tmp_path.glob("01_*.json"))
    data = json.loads(target.read_text(encoding="utf-8"))
    mc = next(e for e in data["exercises"] if e["type"] == "multiple_choice")
    mc["questions"][0]["answer"] = 99
    target.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ContentError):
        load_content(tmp_path)


def test_loader_rejects_too_few_exercises(tmp_path):
    for f in CONTENT_DIR.glob("*.json"):
        (tmp_path / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")
    target = next(tmp_path.glob("02_*.json"))
    data = json.loads(target.read_text(encoding="utf-8"))
    data["exercises"] = data["exercises"][:3]
    target.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ContentError, match="minimum"):
        load_content(tmp_path)
