import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-purple-700 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading admin panel...</p>
      </div>
    </div>
  );
}
