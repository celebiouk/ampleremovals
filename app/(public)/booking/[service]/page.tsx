import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { SERVICE_BY_SLUG } from "@/lib/services";

export function generateStaticParams() {
  return Object.keys(SERVICE_BY_SLUG).map((slug) => ({ service: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { service: string };
}) {
  const meta = SERVICE_BY_SLUG[params.service];
  return {
    title: meta ? `${meta.title} — Get a Quote` : "Get a Quote",
  };
}

const WIZARD_STEPS = [
  "Service",
  "Details",
  "Addresses",
  "Date",
  "Your info",
  "Review",
];

export default function BookingPage({
  params,
}: {
  params: { service: string };
}) {
  const meta = SERVICE_BY_SLUG[params.service];
  if (!meta) notFound();

  const Icon = meta.icon;

  return (
    <div className="bg-brand-purple-50 pb-20 pt-28">
      <div className="container max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {meta.title}
            </h1>
            <p className="text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <StepIndicator steps={WIZARD_STEPS} currentStep={0} className="mb-10" />

          <div className="rounded-xl border border-dashed border-brand-purple-200 bg-brand-purple-50/60 p-10 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">
              Booking wizard coming next
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The multi-step quote form for{" "}
              <span className="font-semibold">{meta.shortTitle}</span> will be
              built in Phase 2. The brand system, step indicator and routing are
              ready.
            </p>
            <Button
              asChild
              className="mt-6 bg-brand-green-600 text-white hover:bg-brand-green-700"
            >
              <Link href="/">Return home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
