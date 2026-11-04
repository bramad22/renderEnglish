import { AnimatePresence, motion } from "framer-motion";
import { Flame, House, Monitor, Moon, Search, Sun } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";

const NAV = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/search", label: "Search", icon: Search }
];

function ThemeToggle() {
  const { mode, cycle } = useTheme();
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  const label = `Theme: ${mode}. Click to change.`;
  return (
    <button onClick={cycle} className="btn-ghost size-10 min-h-10 rounded-full p-0" aria-label={label} title={label}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={mode} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
          <Icon className="size-[18px]" aria-hidden />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const { streak } = useProgress();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/75 backdrop-blur-xl dark:border-white/5 dark:bg-ink-950/75">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Matura Trainer home">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 17V7l7 6 7-6v10" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-semibold text-slate-900 dark:text-white">Matura Trainer</span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Communication & Media</span>
            </span>
          </NavLink>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/5",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {streak > 0 && (
              <span className="chip bg-orange-100 font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" title={`${streak}-day streak`} aria-label={`${streak}-day practice streak`}>
                <Flame className="size-3.5" aria-hidden /> {streak}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-16">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            <ErrorBoundary resetKey={pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
      </main>

      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/85 backdrop-blur-xl md:hidden dark:border-white/5 dark:bg-ink-900/85">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", isActive && "bg-indigo-100 dark:bg-indigo-500/15")}>
                    <n.icon className="size-5" aria-hidden />
                  </span>
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
