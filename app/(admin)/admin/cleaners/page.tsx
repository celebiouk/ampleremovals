import { Sparkles, Clock } from "lucide-react";

export const metadata = { title: "Cleaners" };

export default function CleanersPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-purple-100">
        <Sparkles className="h-11 w-11 text-brand-purple-800" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-slate-900">Cleaners</h1>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-purple-50 px-3.5 py-1.5 text-sm font-semibold text-brand-purple-800">
        <Clock className="h-4 w-4" /> Coming soon
      </span>
      <p className="mt-4 max-w-md text-slate-500">
        Manage your cleaning workforce here — registrations, job assignments and
        earnings — right alongside your removals drivers. We&apos;re building it now.
      </p>
    </div>
  );
}
