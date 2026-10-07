// Mirrors backend/app/models.py. Keep both files in sync when the schema changes.

export type Difficulty = "B2" | "C1" | "Challenge";

export interface InputText {
  title: string;
  paragraphs: string[];
  note?: string | null;
}

export interface PhraseGroup {
  label: string;
  phrases: string[];
}

export interface OutlineStep {
  heading: string;
  points: string[];
}

export interface MCQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface Base {
  id: string;
  section: string;
  title: string;
  instruction: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  tags: string[];
  input_text?: InputText | null;
}

export interface MultipleChoiceEx extends Base {
  type: "multiple_choice";
  questions: MCQuestion[];
}

export interface TFNGEx extends Base {
  type: "true_false_not_given";
  statements: { statement: string; answer: "true" | "false" | "not_given"; explanation: string }[];
}

export interface MatchingEx extends Base {
  type: "matching";
  left_label: string;
  right_label: string;
  pairs: { left: string; right: string; explanation?: string | null }[];
  distractors: string[];
  explanation: string;
}

export interface SortingEx extends Base {
  type: "sorting";
  categories: string[];
  items: { text: string; category: string; explanation?: string | null }[];
  explanation: string;
}

export interface OrderingEx extends Base {
  type: "ordering";
  items: string[];
  explanation: string;
}

export interface ErrorCorrectionEx extends Base {
  type: "error_correction";
  items: { sentence: string; error: string; correction: string; explanation: string }[];
}

export interface TransformationEx extends Base {
  type: "transformation";
  items: {
    original: string;
    keyword?: string | null;
    gapped: string;
    accepted_answers: string[];
    explanation: string;
  }[];
}

export interface TimedQuizEx extends Base {
  type: "timed_quiz";
  total_seconds: number;
  questions: MCQuestion[];
}

export interface FlashcardsEx extends Base {
  type: "flashcards";
  cards: { term: string; definition: string; example: string; note?: string | null }[];
}

export interface ShortAnswerEx extends Base {
  type: "short_answer";
  questions: { question: string; model_answer: string; key_points: string[] }[];
}

export interface RewriteEx extends Base {
  type: "rewrite";
  items: { original: string; model_answer: string; key_points: string[] }[];
}

export interface Stimulus {
  kind: "image" | "text" | "quote" | "chart" | "headline";
  title: string;
  content: string;
}

export interface SpeakingPromptEx extends Base {
  type: "speaking_prompt";
  stimulus: Stimulus;
  task: string;
  content_points: string[];
  follow_up_questions: string[];
  useful_phrases: PhraseGroup[];
  model_outline: OutlineStep[];
  prep_seconds: number;
  speak_seconds: number;
}

export interface Argument {
  point: string;
  explanation: string;
  counter: string;
}

export interface DebateEx extends Base {
  type: "debate";
  motion: string;
  context: string;
  arguments_for: Argument[];
  arguments_against: Argument[];
  phrases: PhraseGroup[];
  tasks: string[];
}

export interface RoleplayEx extends Base {
  type: "roleplay";
  situation: string;
  roles: { name: string; card: string; goals: string[] }[];
  useful_phrases: PhraseGroup[];
  debrief: string[];
}

export interface DilemmaEx extends Base {
  type: "dilemma";
  case: string;
  options: string[];
  guiding_questions: string[];
  perspectives: { stakeholder: string; view: string }[];
  model_answer: string;
}

export type Exercise =
  | MultipleChoiceEx
  | TFNGEx
  | MatchingEx
  | SortingEx
  | OrderingEx
  | ErrorCorrectionEx
  | TransformationEx
  | TimedQuizEx
  | FlashcardsEx
  | ShortAnswerEx
  | RewriteEx
  | SpeakingPromptEx
  | DebateEx
  | RoleplayEx
  | DilemmaEx;

export type ExerciseType = Exercise["type"];

export interface ExerciseSummary {
  id: string;
  section: string;
  type: ExerciseType;
  title: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  tags: string[];
}

export interface SectionSummary {
  id: string;
  order: number;
  title: string;
  short_title: string;
  description: string;
  icon: string;
  accent: string;
  exercise_count: number;
  difficulty_counts: Partial<Record<Difficulty, number>>;
  total_minutes: number;
}

export interface SectionDetail extends SectionSummary {
  intro: string;
  exercises: ExerciseSummary[];
}

export interface SearchHit {
  kind: "exercise" | "vocabulary";
  exercise_id: string;
  section: string;
  title: string;
  snippet: string;
  difficulty: Difficulty;
}

export interface Meta {
  sources: { name: string; publisher: string; url?: string | null; used_for: string }[];
  verify_note: string;
  ai_statement: string;
  how_to_use: { title: string; text: string }[];
  exam_note: string;
}
