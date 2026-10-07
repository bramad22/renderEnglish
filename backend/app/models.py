"""Pydantic schema for all learning content.

Every exercise shares the fields in ``ExerciseBase``. The ``type`` field is the
discriminator that decides which extra fields an exercise must have.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

Difficulty = Literal["B2", "C1", "Challenge"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------- shared parts


class InputText(Strict):
    title: str
    paragraphs: list[str] = Field(min_length=1)
    note: str | None = None  # e.g. "Background text written for this app"


class PhraseGroup(Strict):
    label: str  # e.g. "Conceding a point"
    phrases: list[str] = Field(min_length=1)


class OutlineStep(Strict):
    heading: str
    points: list[str] = Field(min_length=1)


class MCQuestion(Strict):
    prompt: str
    options: list[str] = Field(min_length=2, max_length=5)
    answer: int
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def _answer_in_range(self) -> "MCQuestion":
        if not 0 <= self.answer < len(self.options):
            raise ValueError(f"answer index {self.answer} out of range for '{self.prompt[:40]}'")
        if len(set(self.options)) != len(self.options):
            raise ValueError(f"duplicate options in '{self.prompt[:40]}'")
        return self


class ExerciseBase(Strict):
    id: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")
    section: str
    title: str = Field(min_length=3)
    instruction: str = Field(min_length=10)
    difficulty: Difficulty
    estimated_minutes: int = Field(ge=1, le=60)
    tags: list[str] = []
    input_text: InputText | None = None


# ---------------------------------------------------------------- auto-checked


class MultipleChoice(ExerciseBase):
    type: Literal["multiple_choice"]
    questions: list[MCQuestion] = Field(min_length=1)


class TFNGStatement(Strict):
    statement: str
    answer: Literal["true", "false", "not_given"]
    explanation: str = Field(min_length=1)


class TrueFalseNotGiven(ExerciseBase):
    type: Literal["true_false_not_given"]
    statements: list[TFNGStatement] = Field(min_length=3)

    @model_validator(mode="after")
    def _needs_text(self) -> "TrueFalseNotGiven":
        if self.input_text is None:
            raise ValueError(f"{self.id}: true/false/not given needs an input_text")
        return self


class MatchPair(Strict):
    left: str
    right: str
    explanation: str | None = None


class Matching(ExerciseBase):
    type: Literal["matching"]
    left_label: str
    right_label: str
    pairs: list[MatchPair] = Field(min_length=3)
    distractors: list[str] = []  # extra right-hand options that match nothing
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def _unique_sides(self) -> "Matching":
        rights = [p.right for p in self.pairs] + self.distractors
        lefts = [p.left for p in self.pairs]
        if len(set(rights)) != len(rights) or len(set(lefts)) != len(lefts):
            raise ValueError(f"{self.id}: matching items must be unique")
        return self


class SortItem(Strict):
    text: str
    category: str
    explanation: str | None = None


class Sorting(ExerciseBase):
    type: Literal["sorting"]
    categories: list[str] = Field(min_length=2)
    items: list[SortItem] = Field(min_length=4)
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def _known_categories(self) -> "Sorting":
        for item in self.items:
            if item.category not in self.categories:
                raise ValueError(f"{self.id}: unknown category '{item.category}'")
        return self


class Ordering(ExerciseBase):
    type: Literal["ordering"]
    items: list[str] = Field(min_length=3)  # stored in the CORRECT order
    explanation: str = Field(min_length=1)


class ErrorItem(Strict):
    sentence: str
    error: str  # the wrong part, must appear verbatim in sentence
    correction: str  # the full corrected sentence
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def _error_in_sentence(self) -> "ErrorItem":
        if self.error not in self.sentence:
            raise ValueError(f"error '{self.error}' not found in '{self.sentence}'")
        return self


class ErrorCorrection(ExerciseBase):
    type: Literal["error_correction"]
    items: list[ErrorItem] = Field(min_length=3)


class TransformItem(Strict):
    original: str
    keyword: str | None = None
    gapped: str  # second sentence, the gap is written as ___
    accepted_answers: list[str] = Field(min_length=1)
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def _has_gap(self) -> "TransformItem":
        if self.gapped.count("___") != 1:
            raise ValueError(f"gapped sentence needs exactly one ___: '{self.gapped}'")
        return self


class Transformation(ExerciseBase):
    type: Literal["transformation"]
    items: list[TransformItem] = Field(min_length=3)


class TimedQuiz(ExerciseBase):
    type: Literal["timed_quiz"]
    total_seconds: int = Field(ge=20, le=600)
    questions: list[MCQuestion] = Field(min_length=5)


# ---------------------------------------------------------------- self-checked


class Flashcard(Strict):
    term: str
    definition: str
    example: str
    note: str | None = None


class Flashcards(ExerciseBase):
    type: Literal["flashcards"]
    cards: list[Flashcard] = Field(min_length=5)


class ShortAnswerQuestion(Strict):
    question: str
    model_answer: str
    key_points: list[str] = Field(min_length=1)


class ShortAnswer(ExerciseBase):
    type: Literal["short_answer"]
    questions: list[ShortAnswerQuestion] = Field(min_length=1)


class RewriteItem(Strict):
    original: str
    model_answer: str
    key_points: list[str] = Field(min_length=1)


class Rewrite(ExerciseBase):
    """Register upgrade, paraphrasing, cohesion: open answers, compared with a model."""

    type: Literal["rewrite"]
    items: list[RewriteItem] = Field(min_length=3)


# ---------------------------------------------------------------- speaking


class Stimulus(Strict):
    kind: Literal["image", "text", "quote", "chart", "headline"]
    title: str
    content: str


class SpeakingPrompt(ExerciseBase):
    type: Literal["speaking_prompt"]
    stimulus: Stimulus
    task: str
    content_points: list[str] = Field(min_length=2)
    follow_up_questions: list[str] = Field(min_length=3)
    useful_phrases: list[PhraseGroup] = Field(min_length=1)
    model_outline: list[OutlineStep] = Field(min_length=2)
    prep_seconds: int = Field(ge=30, le=1800)
    speak_seconds: int = Field(ge=30, le=900)


class Argument(Strict):
    point: str
    explanation: str
    counter: str


class Debate(ExerciseBase):
    type: Literal["debate"]
    motion: str
    context: str
    arguments_for: list[Argument] = Field(min_length=3)
    arguments_against: list[Argument] = Field(min_length=3)
    phrases: list[PhraseGroup] = Field(min_length=1)
    tasks: list[str] = Field(min_length=1)


class RoleCard(Strict):
    name: str
    card: str
    goals: list[str] = Field(min_length=1)


class Roleplay(ExerciseBase):
    type: Literal["roleplay"]
    situation: str
    roles: list[RoleCard] = Field(min_length=2)
    useful_phrases: list[PhraseGroup] = Field(min_length=1)
    debrief: list[str] = Field(min_length=1)


class Perspective(Strict):
    stakeholder: str
    view: str


class Dilemma(ExerciseBase):
    type: Literal["dilemma"]
    case: str
    options: list[str] = Field(min_length=2)
    guiding_questions: list[str] = Field(min_length=2)
    perspectives: list[Perspective] = Field(min_length=2)
    model_answer: str  # how a strong answer could be structured


Exercise = Annotated[
    Union[
        MultipleChoice,
        TrueFalseNotGiven,
        Matching,
        Sorting,
        Ordering,
        ErrorCorrection,
        Transformation,
        TimedQuiz,
        Flashcards,
        ShortAnswer,
        Rewrite,
        SpeakingPrompt,
        Debate,
        Roleplay,
        Dilemma,
    ],
    Field(discriminator="type"),
]

AUTO_CHECKED_TYPES = {
    "multiple_choice",
    "true_false_not_given",
    "matching",
    "sorting",
    "ordering",
    "error_correction",
    "transformation",
    "timed_quiz",
}


# ---------------------------------------------------------------- sections


class Section(Strict):
    id: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")
    order: int
    title: str
    short_title: str
    description: str
    icon: str  # name of a lucide-react icon
    accent: str  # tailwind colour family, e.g. "indigo"
    intro: str
    exercises: list[Exercise] = []

    @model_validator(mode="after")
    def _exercises_belong_here(self) -> "Section":
        for ex in self.exercises:
            if ex.section != self.id:
                raise ValueError(f"exercise {ex.id} says section '{ex.section}' but lives in '{self.id}'")
        return self


class Source(Strict):
    name: str
    publisher: str
    url: str | None = None
    used_for: str


class GuideStep(Strict):
    title: str
    text: str


class Meta(Strict):
    """Content for the Sources & AI usage page."""

    sources: list[Source] = Field(min_length=1)
    verify_note: str
    ai_statement: str
    how_to_use: list[GuideStep] = Field(min_length=1)
    exam_note: str


# ---------------------------------------------------------------- API views


class ExerciseSummary(BaseModel):
    id: str
    section: str
    type: str
    title: str
    difficulty: Difficulty
    estimated_minutes: int
    tags: list[str]


class SectionSummary(BaseModel):
    id: str
    order: int
    title: str
    short_title: str
    description: str
    icon: str
    accent: str
    exercise_count: int
    difficulty_counts: dict[str, int]
    total_minutes: int


class SectionDetail(SectionSummary):
    intro: str
    exercises: list[ExerciseSummary]


class SearchHit(BaseModel):
    kind: Literal["exercise", "vocabulary"]
    exercise_id: str
    section: str
    title: str
    snippet: str
    difficulty: Difficulty
