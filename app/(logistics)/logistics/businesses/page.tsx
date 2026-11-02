import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertCircle, TrendingUp, Clock, FileText, Truck, Repeat, Zap, Calendar } from "lucide-react";
import { LOGISTICS, logisticsPageMetadata } from "@/lib/logistics";
import { BusinessRequestForm } from "@/components/logistics/BusinessRequestForm";

export const metadata: Metadata = logisticsPageMetadata(
  "For Businesses — Hire an HGV Driver | Ample Logistics",
  "Find temporary and short-notice HGV driver staffing solutions for your transport or logistics operation across Berkshire England.",
  "/businesses"
);

const CHALLENGES = [
  { icon: AlertCircle, label: "Unexpected driver absences" },
  { icon: TrendingUp, label: "Increased delivery demand" },
  { icon: Calendar, label: "Seasonal workload fluctuations" },
  { icon: FileText, label: "Temporary contract requirements" },
  { icon: Truck, label: "Additional vehicles or routes" },
  { icon: Clock, label: "Last-minute operational changes" },
];

const SOLUTIONS = [
  { title: "Temporary HGV Driver Staffing", body: "Cover for absence, leave, or short-term increases in demand, for as long as the assignment requires." },
  { title: "Short-Notice Driver Requirements", body: "Tell us what's happened and we'll work to identify suitable, available drivers as quickly as we reasonably can." },
  { title: "Flexible Shift Cover", body: "Day, night, or weekend shifts — we work around your operation's actual working pattern." },
  { title: "Recurring Driver Staffing Requirements", body: "For businesses that need ongoing flexible cover rather than a one-off placement." },
];

export default function BusinessesPage() {
  return (
    <>
      <section className="px-6 py-20 text-white" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.charcoal})` }}>
        <div className="container mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-tight">Your Next HGV Driver Starts Here.</h1>
            <p className="mt-4 text-lg text-slate-300">Find temporary and short-notice HGV driver staffing solutions for your transport or logistics operation across Berkshire England.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#request-form" className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Request a Driver <ArrowRight className="h-4 w-4" /></a>
              <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10">Speak to Our Team</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>When You Need Drivers, Every Shift Matters.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CHALLENGES.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <c.icon className="h-5 w-5 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                <span className="font-medium text-slate-700">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">Ample Logistics works as a staffing partner to help businesses respond to these challenges.</p>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center" style={{ color: LOGISTICS.colors.navy }}>Staffing Solutions</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {SOLUTIONS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>How to Request a Driver</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { icon: FileText, body: "Submit your staffing requirements." },
              { icon: Zap, body: "Our team reviews the details and checks suitable driver availability." },
              { icon: Repeat, body: "We discuss rates, assignment terms, and any necessary arrangements." },
              { icon: Truck, body: "Once agreed, the driver is scheduled for the assignment." },
            ].map((s, i) => (
              <div key={i} className="text-left">
                <s.icon className="h-6 w-6" style={{ color: LOGISTICS.colors.blue }} />
                <p className="mt-3 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="request-form" className="px-6 py-20" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center" style={{ color: LOGISTICS.colors.navy }}>Submit a Driver Request</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">Tell us what you need and our team will review it and come back to you.</p>
          <div className="mt-10 rounded-2xl bg-white p-6 sm:p-10">
            <BusinessRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
