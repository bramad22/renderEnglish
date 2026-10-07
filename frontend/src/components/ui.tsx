import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CircleCheck, CircleX, Eye, EyeOff, Lightbulb, RotateCcw, TriangleAlert } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { Difficulty, InputText } from "../api/types";
import { DIFFICULTY_STYLES } from "../lib/theme";
import { cn } from "../lib/utils";

export function DifficultyBadge({ level, className }: { level: Difficulty; className?: string }) {
  return (
    <span className={cn("chip", DIFFICULTY_STYLES[level], className)} title={`Level: ${level}`}>
      {level === "Challenge" ? "★ Challenge" : level}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  colorClass = "stroke-indigo-500",
  label,
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  colorClass?: string;
  label: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={colorClass}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, className, barClass = "bg-indigo-500", label }: { value: number; className?: string; barClass?: string; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <motion.div className={cn("h-full rounded-full", barClass)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-ink-850" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-start gap-3 p-6" role="alert">
      <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
        <TriangleAlert className="size-5" aria-hidden /> Something went wrong
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {error.message}. If content does not load, check that the backend is running (see the README for the start command).
      </p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}

/** A button that reveals hidden content (solutions, model answers) with a smooth animation. */
export function Reveal({
  label = "Show solution",
  hideLabel = "Hide solution",
  children,
  defaultOpen = false,
  className,
}: {
  label?: string;
  hideLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button className="btn-secondary" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {open ? hideLabel : label}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Collapsible({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="card overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2.5">
          {icon}
          {title}
        </span>
        <ChevronDown className={cn("size-5 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4 dark:border-white/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Correct / incorrect feedback with an explanation. Announced to screen readers. */
export function Feedback({ correct, children, title }: { correct: boolean; children?: ReactNode; title?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0, x: correct ? 0 : [0, -5, 5, -3, 3, 0] }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      className={cn(
        "mt-3 flex gap-2.5 rounded-xl px-3.5 py-3 text-sm",
        correct
          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100",
      )}
    >
      {correct ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : (
        <CircleX className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
      )}
      <div>
        <span className="font-semibold">{title ?? (correct ? "Correct!" : "Not quite.")}</span> {children}
      </div>
    </motion.div>
  );
}

export function Explanation({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function InputTextCard({ text }: { text: InputText }) {
  return (
    <article className="card p-5 sm:p-7">
      <p className="eyebrow mb-2">Input text</p>
      <h3 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">{text.title}</h3>
      <div className="prose-text mt-4 text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        {text.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {text.note && <p className="mt-5 text-xs text-slate-500 italic dark:text-slate-400">{text.note}</p>}
    </article>
  );
}

/** Shown after an auto-checked exercise is finished. */
export function ScoreSummary({ correct, total, onRetry }: { correct: number; total: number; onRetry: () => void }) {
  const pct = total ? correct / total : 0;
  const message = pct === 1 ? "Perfect score!" : pct >= 0.75 ? "Great work!" : pct >= 0.5 ? "Good effort – review the explanations." : "Keep practising – read the explanations carefully.";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left"
      role="status"
      aria-live="polite"
    >
      <ProgressRing value={pct} size={72} stroke={7} colorClass={pct >= 0.75 ? "stroke-emerald-500" : pct >= 0.5 ? "stroke-amber-500" : "stroke-rose-500"} label={`Score ${correct} of ${total}`}>
        <span className="text-sm">{Math.round(pct * 100)}%</span>
      </ProgressRing>
      <div className="flex-1">
        <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">
          {correct} / {total} correct
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{message} Your result has been saved.</p>
      </div>
      <button className="btn-secondary" onClick={onRetry}>
        <RotateCcw className="size-4" aria-hidden /> Try again
      </button>
    </motion.div>
  );
}

/** Generic segmented filter (difficulty chips etc.). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-9 rounded-full px-3.5 text-sm font-medium transition",
            value === o.value
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-ink-850 dark:text-slate-300 dark:ring-white/10",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
