"use client";

import { Component, type ReactNode } from "react";
import { logError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error.message, error.stack || null, "high");
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-red-500" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-bold text-zinc-900">Something went wrong</h2>
          <p className="mb-4 text-sm text-zinc-500">An unexpected error occurred. Please try refreshing the page.</p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Refresh Page
          </button>
          {this.state.error && (
            <p className="mt-4 max-w-md text-center text-xs text-zinc-400">{this.state.error.message}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
