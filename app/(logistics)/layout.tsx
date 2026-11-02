import { LogisticsHeader, LogisticsFooter } from "@/components/logistics/LogisticsChrome";

/**
 * Ample Logistics' own site chrome — separate from both the removals
 * (public) layout and the white-label (brands) layout, since this is a
 * different business line entirely. See tasks/brand-playbook.md.
 */
export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LogisticsHeader />
      <main className="flex-1">{children}</main>
      <LogisticsFooter />
    </div>
  );
}
