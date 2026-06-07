import { Loader2, Truck } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <Truck className="w-16 h-16 text-brand-purple-700" />
          <Loader2 className="w-6 h-6 text-brand-purple-400 animate-spin absolute -bottom-2 -right-2" />
        </div>

        <h2 className="text-xl font-semibold text-slate-700 font-display">
          Loading...
        </h2>
      </div>
    </div>
  );
}
