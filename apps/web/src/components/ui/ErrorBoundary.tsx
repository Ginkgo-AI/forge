import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-forge-bg">
          <div className="text-center max-w-sm mx-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-forge-danger/10 mb-4">
              <AlertTriangle size={24} className="text-forge-danger" />
            </div>
            <h2 className="text-lg font-semibold text-forge-text mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-forge-text-muted mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white text-sm transition-colors"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
