import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface State {
  error: Error | null;
}

// Keeps one broken page from blanking the whole app. The shell (sidebar and
// header) stays usable and the real error message is shown.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">This page failed to load</h2>
        <p className="mt-1 text-sm text-gray-500">Something went wrong while showing this page. The rest of the app is still available.</p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-50 p-3 text-left text-xs text-red-700">{error.message}</pre>
        <div className="mt-5 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700">
            Reload
          </button>
          <Link to="/" className="rounded-2xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
