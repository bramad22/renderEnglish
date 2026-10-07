import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A pausable countdown based on wall-clock time, so it stays accurate even if
 * the browser throttles timers in a background tab.
 */
export function useCountdown(initialSeconds: number, onFinish?: () => void) {
  const [duration, setDuration] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef<number | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, ((endAt.current ?? 0) - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        endAt.current = null;
        finishRef.current?.();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setRemaining((r) => {
      const from = r <= 0 ? duration : r;
      endAt.current = Date.now() + from * 1000;
      return from;
    });
    setRunning(true);
  }, [duration]);

  const pause = useCallback(() => {
    setRunning(false);
    if (endAt.current) setRemaining(Math.max(0, (endAt.current - Date.now()) / 1000));
    endAt.current = null;
  }, []);

  const reset = useCallback(
    (seconds?: number) => {
      const s = seconds ?? duration;
      setRunning(false);
      endAt.current = null;
      setDuration(s);
      setRemaining(s);
    },
    [duration],
  );

  return { remaining, duration, running, start, pause, reset, progress: duration ? 1 - remaining / duration : 0 };
}
