import { MotionConfig } from "framer-motion";
import { lazy, Suspense, type ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/ui";
import { ProgressProvider } from "./hooks/useProgress";
import { HomePage } from "./pages/HomePage";
import { SectionPage } from "./pages/SectionPage";

// Heavier pages are loaded on demand to keep the first load fast on phones.
const ExercisePage = lazy(() => import("./pages/ExercisePage").then((m) => ({ default: m.ExercisePage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })));

const page = (node: ReactNode) => <Suspense fallback={<LoadingState />}>{node}</Suspense>;

function NotFound() {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-3xl font-semibold">Page not found</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    // "user" respects the operating system's reduced-motion setting
    <MotionConfig reducedMotion="user">
      <ProgressProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="section/:id" element={<SectionPage />} />
            <Route path="exercise/:id" element={page(<ExercisePage />)} />
            <Route path="search" element={page(<SearchPage />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ProgressProvider>
    </MotionConfig>
  );
}
