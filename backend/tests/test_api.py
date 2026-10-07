from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["exercises"] >= 80


def test_sections_are_ordered_and_counted():
    r = client.get("/api/sections")
    assert r.status_code == 200
    sections = r.json()
    orders = [s["order"] for s in sections]
    assert orders == sorted(orders)
    for s in sections:
        assert s["exercise_count"] >= 10
        assert sum(s["difficulty_counts"].values()) == s["exercise_count"]


def test_section_detail_lists_exercises_without_solutions():
    r = client.get("/api/sections/vocabulary")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "vocabulary"
    first = body["exercises"][0]
    assert {"id", "type", "title", "difficulty", "estimated_minutes"} <= first.keys()
    assert "questions" not in first and "pairs" not in first


def test_unknown_section_returns_404():
    assert client.get("/api/sections/does-not-exist").status_code == 404


def test_exercise_detail_has_full_payload():
    summary = client.get("/api/sections/key-facts").json()["exercises"][0]
    r = client.get(f"/api/exercises/{summary['id']}")
    assert r.status_code == 200
    ex = r.json()
    assert ex["id"] == summary["id"]
    assert ex["instruction"]


def test_unknown_exercise_returns_404():
    assert client.get("/api/exercises/nope").status_code == 404


def test_filter_by_difficulty():
    r = client.get("/api/exercises", params={"difficulty": "Challenge"})
    assert r.status_code == 200
    items = r.json()
    assert items and all(e["difficulty"] == "Challenge" for e in items)


def test_search_finds_exercises_and_vocabulary():
    r = client.get("/api/search", params={"q": "filter bubble"})
    assert r.status_code == 200
    hits = r.json()
    assert hits
    assert {h["kind"] for h in hits} <= {"exercise", "vocabulary"}


def test_search_short_query_returns_empty():
    assert client.get("/api/search", params={"q": "a"}).json() == []


def test_exam_prompts():
    prompts = client.get("/api/exam/prompts").json()
    assert len(prompts) >= 10
    assert all(p["type"] == "speaking_prompt" for p in prompts)


def test_meta():
    meta = client.get("/api/meta").json()
    assert meta["sources"]
    assert "AI was used" in meta["ai_statement"]


def test_cors_header_for_vite_dev_server():
    r = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"
