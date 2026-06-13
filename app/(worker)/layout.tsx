import { ReactNode } from 'react';
import Link from 'next/link';
import { SignOutButton } from './SignOutButton';

export const metadata = {
  title: 'My Payslips - Ample Removals',
  description: 'View your payslips and earnings',
};

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/payslips" className="text-2xl font-bold text-purple-600">
            Ample
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/payslips"
              className="text-slate-600 hover:text-slate-900 font-medium transition"
            >
              My Payslips
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-slate-600 text-sm">
          <p>
            © {new Date().getFullYear()} Ample Removals. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
