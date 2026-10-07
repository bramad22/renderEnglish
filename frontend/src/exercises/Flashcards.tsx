import { motion } from "framer-motion";
import { Check, RotateCcw, Shuffle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FlashcardsEx } from "../api/types";
import { ProgressBar } from "../components/ui";
import { shuffle } from "../lib/utils";
import type { ExerciseProps } from "./types";

/**
 * Know / don't know mode: unknown cards go back to the end of the queue until
 * every card is known. Score = share of cards known on the first try.
 */
export function Flashcards({ ex, onComplete }: ExerciseProps<FlashcardsEx>) {
  const all = ex.cards.map((_, i) => i);
  const [queue, setQueue] = useState<number[]>(all);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [known, setKnown] = useState(0);
  const reported = useRef(false);

  const current = queue[0];
  const finished = queue.length === 0;

  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true;
      onComplete((ex.cards.length - missed.size) / ex.cards.length);
    }
  }, [finished, missed.size, ex.cards.length, onComplete]);

  const grade = (knowIt: boolean) => {
    if (current === undefined) return;
    setFlipped(false);
    if (knowIt) {
      setKnown((k) => k + 1);
      setQueue((q) => q.slice(1));
    } else {
      setMissed((m) => new Set(m).add(current));
      setQueue((q) => [...q.slice(1), current]);
    }
  };

  const restart = (cards: number[]) => {
    reported.current = false;
    setQueue(shuffle(cards));
    setMissed(new Set());
    setKnown(0);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || (e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        if ((e.target as HTMLElement).tagName === "BUTTON" && e.key === "Enter") return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === "ArrowRight") grade(true);
      else if (flipped && e.key === "ArrowLeft") grade(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) {
    const firstTry = ex.cards.length - missed.size;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center" role="status">
        <p className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Deck complete!</p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          You knew <strong>{firstTry}</strong> of {ex.cards.length} cards on the first try.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={() => restart(all)}>
            <Shuffle className="size-4" aria-hidden /> Shuffle and restart
          </button>
          {missed.size > 0 && (
            <button className="btn-secondary" onClick={() => restart([...missed])}>
              <RotateCcw className="size-4" aria-hidden /> Practise the {missed.size} difficult cards
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const card = ex.cards[current];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <ProgressBar value={known / ex.cards.length} label="Cards known" barClass="bg-violet-500" />
        <span className="shrink-0 tabular-nums">
          {known}/{ex.cards.length}
        </span>
      </div>

      <div className="[perspective:1200px]">
          <motion.button
            key={`${current}-${queue.length}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, rotateY: flipped ? 180 : 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? `Definition: ${card.definition}. Example: ${card.example}` : `Term: ${card.term}. Activate to flip.`}
            className="relative block min-h-72 w-full text-left [transform-style:preserve-3d]"
          >
            <div className="card absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center [backface-visibility:hidden]">
              <span className="eyebrow">Term</span>
              <span className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl dark:text-white">{card.term}</span>
              <span className="mt-4 text-xs text-slate-400">Explain it in your own words, then tap to flip (or press Space)</span>
            </div>
            <div className="card absolute inset-0 flex flex-col justify-center gap-4 overflow-auto bg-gradient-to-br from-violet-50 to-white p-7 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:from-violet-500/10 dark:to-ink-900">
              <div>
                <span className="eyebrow">Definition</span>
                <p className="mt-1 text-lg leading-snug font-medium text-slate-900 dark:text-white">{card.definition}</p>
              </div>
              <div>
                <span className="eyebrow">Example</span>
                <p className="mt-1 text-slate-700 italic dark:text-slate-300">“{card.example}”</p>
              </div>
              {card.note && <p className="text-sm text-slate-500">{card.note}</p>}
            </div>
          </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary min-h-12" disabled={!flipped} onClick={() => grade(false)}>
          <X className="size-4 text-rose-500" aria-hidden /> Not yet
        </button>
        <button className="btn min-h-12 bg-emerald-600 text-white hover:bg-emerald-500" disabled={!flipped} onClick={() => grade(true)}>
          <Check className="size-4" aria-hidden /> I know it
        </button>
      </div>
      <p className="text-center text-xs text-slate-400">
        {queue.length} card{queue.length === 1 ? "" : "s"} left · keyboard: Space = flip, ← not yet, → I know it
      </p>
    </div>
  );
}
