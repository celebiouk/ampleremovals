import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { SuccessCheck } from "@/components/booking/SuccessCheck";
import { ConfirmationNotifyTrigger } from "@/components/booking/ConfirmationNotifyTrigger";
import { SERVICE_BY_SLUG } from "@/lib/services";
import { getAssignmentMessage } from "@/lib/business-hours";

export const metadata = { title: "Booking Request Received" };

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string; service?: string; bid?: string; t?: string };
}) {
  const reference = searchParams.ref;
  const serviceMeta = searchParams.service
    ? SERVICE_BY_SLUG[searchParams.service]
    : undefined;
  const makeAnotherHref = serviceMeta
    ? `/booking/${serviceMeta.slug}`
    : "/booking/removals";
  const assignment = getAssignmentMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ff] px-5 py-24">
      <ConfirmationNotifyTrigger bookingId={searchParams.bid} token={searchParams.t} />
      <div className="w-full max-w-[600px] rounded-3xl bg-white p-8 text-center shadow-xl shadow-brand-purple-900/10 sm:p-12">
        <SuccessCheck />

        <h1 className="mt-7 font-display text-3xl font-extrabold tracking-tight text-brand-purple-950 sm:text-4xl">
          Booking Request Received!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Thank you for choosing Ample Removals.
        </p>

        {reference && (
          <div className="mx-auto mt-7 inline-flex flex-col items-center rounded-2xl border border-brand-purple-100 bg-brand-purple-50 px-7 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-purple-500">
              Your reference
            </span>
            <span className="font-display text-2xl font-extrabold tracking-wider text-brand-purple-800">
              {reference}
            </span>
          </div>
        )}

        {/* Assignment message — no price here; a real person calls instead */}
        <div className="mt-9 rounded-2xl border border-brand-green-100 bg-brand-green-50/60 p-5 text-left">
          <h2 className="font-display text-lg font-bold text-brand-purple-950">
            {assignment.heading}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
            {assignment.line}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3.5 text-base font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Home className="h-5 w-5" />
            Back to Homepage
          </Link>
          <Link
            href={makeAnotherHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-purple-900"
          >
            <RotateCcw className="h-5 w-5" />
            Make Another Booking
          </Link>
        </div>
      </div>
    </div>
  );
}
