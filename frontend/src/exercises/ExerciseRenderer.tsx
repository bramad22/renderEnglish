import type { Exercise } from "../api/types";
import { MultipleChoice, TrueFalseNotGiven } from "./ChoiceQuestions";
import { ErrorCorrection } from "./ErrorCorrection";
import { Flashcards } from "./Flashcards";
import { Debate, Dilemma, Roleplay } from "./Interaction";
import { Matching } from "./Matching";
import { Rewrite, ShortAnswer } from "./OpenAnswers";
import { Ordering } from "./Ordering";
import { Sorting } from "./Sorting";
import { SpeakingPrompt } from "./SpeakingPrompt";
import { TimedQuiz } from "./TimedQuiz";
import { Transformation } from "./Transformation";

/** Picks the right interactive component for an exercise type. */
export function ExerciseRenderer({ ex, onComplete }: { ex: Exercise; onComplete: (score: number | null) => void }) {
  switch (ex.type) {
    case "multiple_choice":
      return <MultipleChoice ex={ex} onComplete={onComplete} />;
    case "true_false_not_given":
      return <TrueFalseNotGiven ex={ex} onComplete={onComplete} />;
    case "matching":
      return <Matching ex={ex} onComplete={onComplete} />;
    case "sorting":
      return <Sorting ex={ex} onComplete={onComplete} />;
    case "ordering":
      return <Ordering ex={ex} onComplete={onComplete} />;
    case "error_correction":
      return <ErrorCorrection ex={ex} onComplete={onComplete} />;
    case "transformation":
      return <Transformation ex={ex} onComplete={onComplete} />;
    case "timed_quiz":
      return <TimedQuiz ex={ex} onComplete={onComplete} />;
    case "flashcards":
      return <Flashcards ex={ex} onComplete={onComplete} />;
    case "short_answer":
      return <ShortAnswer ex={ex} onComplete={onComplete} />;
    case "rewrite":
      return <Rewrite ex={ex} onComplete={onComplete} />;
    case "speaking_prompt":
      return <SpeakingPrompt ex={ex} onComplete={onComplete} />;
    case "debate":
      return <Debate ex={ex} onComplete={onComplete} />;
    case "roleplay":
      return <Roleplay ex={ex} onComplete={onComplete} />;
    case "dilemma":
      return <Dilemma ex={ex} onComplete={onComplete} />;
  }
}
