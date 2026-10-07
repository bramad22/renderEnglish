import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ui";

/** Keeps a crash in one page from blanking the whole app. Reset by changing `resetKey`. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed:", error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return <ErrorState error={new Error(`This page hit an error (${this.state.error.message})`)} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
