"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try refreshing the page or return to the homepage.
            </p>

            {error.digest && (
              <p className="text-xs text-slate-400 mb-6 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-brand-purple-700 text-white rounded-xl hover:bg-brand-purple-800 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
