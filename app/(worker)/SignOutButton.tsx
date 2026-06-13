"use client";

import { LogOut } from "lucide-react";

/**
 * Sign-out button for the worker portal header.
 * Extracted into its own client component because the parent layout is a
 * Server Component (it exports `metadata`) and cannot carry an onClick handler.
 */
export function SignOutButton() {
  return (
    <button
      onClick={() => {
        window.location.href = "/api/auth/logout";
      }}
      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
