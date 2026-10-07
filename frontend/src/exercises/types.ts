import type { Exercise } from "../api/types";

export interface ExerciseProps<T extends Exercise> {
  ex: T;
  /** Called when the learner finishes. Score is 0..1, or null for open tasks without a score. */
  onComplete: (score: number | null) => void;
}
