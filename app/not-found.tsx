import { FileQuestion, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-block relative">
            <h1 className="text-[150px] font-bold text-brand-purple-700 leading-none font-display">
              404
            </h1>
            <FileQuestion className="w-16 h-16 text-brand-purple-400 absolute -top-4 -right-16" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">
          Page Not Found
        </h2>

        <p className="text-lg text-slate-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-xl hover:bg-brand-green-700 transition-colors font-bold shadow-lg shadow-green-500/20"
          >
            <Home className="w-5 h-5" />
            Back to Homepage
          </Link>

          <Link
            href="/booking/removals"
            className="flex items-center gap-2 px-6 py-3 bg-brand-purple-700 text-white rounded-xl hover:bg-brand-purple-800 transition-colors font-bold shadow-lg shadow-purple-500/20"
          >
            <Search className="w-5 h-5" />
            Get a Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
