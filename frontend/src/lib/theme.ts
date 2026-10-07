import {
  ArrowDownUp,
  BookOpen,
  Brain,
  CircleHelp,
  FileText,
  GraduationCap,
  Layers,
  Library,
  ListChecks,
  MessagesSquare,
  Mic,
  Newspaper,
  PenTool,
  Repeat,
  Scale,
  Shuffle,
  SpellCheck,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Difficulty, ExerciseType } from "../api/types";

/** Section icons are stored by name in the content files. */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  Newspaper,
  BookOpen,
  Mic,
  MessagesSquare,
  Users,
  PenTool,
  Trophy,
  GraduationCap,
  Library,
};

export interface AccentClasses {
  gradient: string; // icon tile / hero background
  soft: string; // soft tinted background
  text: string;
  ring: string; // stroke colour for progress rings (SVG `stroke`)
  bar: string; // progress bar fill
}

// Full class strings are written out so Tailwind can detect them at build time.
export const ACCENTS: Record<string, AccentClasses> = {
  indigo: { gradient: "from-indigo-500 to-blue-500", soft: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-300", ring: "stroke-indigo-500", bar: "bg-indigo-500" },
  violet: { gradient: "from-violet-500 to-purple-500", soft: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-300", ring: "stroke-violet-500", bar: "bg-violet-500" },
  rose: { gradient: "from-rose-500 to-pink-500", soft: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-300", ring: "stroke-rose-500", bar: "bg-rose-500" },
  amber: { gradient: "from-amber-500 to-orange-500", soft: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", ring: "stroke-amber-500", bar: "bg-amber-500" },
  emerald: { gradient: "from-emerald-500 to-teal-500", soft: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", ring: "stroke-emerald-500", bar: "bg-emerald-500" },
  sky: { gradient: "from-sky-500 to-cyan-500", soft: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-700 dark:text-sky-300", ring: "stroke-sky-500", bar: "bg-sky-500" },
  fuchsia: { gradient: "from-fuchsia-500 to-pink-500", soft: "bg-fuchsia-50 dark:bg-fuchsia-500/10", text: "text-fuchsia-700 dark:text-fuchsia-300", ring: "stroke-fuchsia-500", bar: "bg-fuchsia-500" },
  orange: { gradient: "from-orange-500 to-red-500", soft: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", ring: "stroke-orange-500", bar: "bg-orange-500" },
  slate: { gradient: "from-slate-500 to-slate-700", soft: "bg-slate-100 dark:bg-white/5", text: "text-slate-700 dark:text-slate-300", ring: "stroke-slate-500", bar: "bg-slate-500" },
};

export const accent = (name: string): AccentClasses => ACCENTS[name] ?? ACCENTS.indigo;

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  B2: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  C1: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  Challenge: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
};

export const TYPE_INFO: Record<ExerciseType, { label: string; icon: LucideIcon; selfChecked: boolean }> = {
  multiple_choice: { label: "Multiple choice", icon: CircleHelp, selfChecked: false },
  true_false_not_given: { label: "True / False / Not given", icon: Scale, selfChecked: false },
  matching: { label: "Matching", icon: Shuffle, selfChecked: false },
  sorting: { label: "Sorting", icon: Layers, selfChecked: false },
  ordering: { label: "Put in order", icon: ArrowDownUp, selfChecked: false },
  error_correction: { label: "Error correction", icon: SpellCheck, selfChecked: false },
  transformation: { label: "Transformation", icon: Repeat, selfChecked: false },
  timed_quiz: { label: "Timed quiz", icon: Timer, selfChecked: false },
  flashcards: { label: "Flashcards", icon: Brain, selfChecked: true },
  short_answer: { label: "Short answer", icon: FileText, selfChecked: true },
  rewrite: { label: "Rewrite", icon: PenTool, selfChecked: true },
  speaking_prompt: { label: "Speaking task", icon: Mic, selfChecked: true },
  debate: { label: "Debate", icon: MessagesSquare, selfChecked: true },
  roleplay: { label: "Role-play", icon: Users, selfChecked: true },
  dilemma: { label: "Dilemma", icon: ListChecks, selfChecked: true },
};
