import {
  CalendarCheck,
  Users,
  FileText,
  PoundSterling,
} from "lucide-react";

const STATS = [
  { label: "Total bookings", value: "—", icon: CalendarCheck },
  { label: "Customers", value: "—", icon: Users },
  { label: "Open invoices", value: "—", icon: FileText },
  { label: "Revenue (30d)", value: "—", icon: PoundSterling },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-foreground">
          Dashboard
        </h2>
        <p className="text-muted-foreground">
          Overview of bookings, customers and revenue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-800">
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <h3 className="font-display text-lg font-bold text-foreground">
          Live metrics &amp; charts coming in Phase 4
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          The database schema and authentication are in place. Recharts-powered
          reporting and the bookings pipeline will be wired up next.
        </p>
      </div>
    </div>
  );
}
