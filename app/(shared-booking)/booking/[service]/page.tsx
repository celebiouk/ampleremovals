import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SERVICE_BY_SLUG } from "@/lib/services";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getCurrentBrand } from "@/lib/brand-context";
import { brandPageMetadata } from "@/lib/brands";
import type { BrandSlug } from "@/components/booking/wizard-configs";

export async function generateMetadata({
  params,
}: {
  params: { service: string };
}) {
  const meta = SERVICE_BY_SLUG[params.service];
  const title = meta ? `${meta.title} — Get a Quote` : "Get a Quote";
  const brand = await getCurrentBrand();
  return brandPageMetadata(brand, title, "Free, no-obligation quote in a few quick steps.", `/booking/${params.service}`);
}

// Intro sub-heading, per brand — small on-page thing, but identical wording
// here would be a tell for anyone comparing brands side by side.
const INTRO_SUBHEAD: Record<BrandSlug, string> = {
  ample: "Free, no-obligation quote in a few quick steps.",
  "thatcham-movers": "A few quick questions and we'll have your price.",
  "newbury-removals": "Answer a few questions to receive your personalised quote.",
  manyvans: "Quick questions, fast price. Let's go.",
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { service: string };
  searchParams: { postcode?: string };
}) {
  const meta = SERVICE_BY_SLUG[params.service];
  if (!meta) notFound();

  const Icon = meta.icon;
  const brand = await getCurrentBrand();
  const brandSlug = brand.slug as BrandSlug;

  return (
    <div className="min-h-screen pb-24 pt-24 sm:pb-16 sm:pt-28" style={{ backgroundColor: "var(--bp-50, #f5f3ff)" }}>
      <div className="container">
        <div className="mx-auto mb-8 max-w-[680px]">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-purple-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">
                {meta.title}
              </h1>
              <p className="text-sm text-slate-500">
                {INTRO_SUBHEAD[brandSlug] ?? INTRO_SUBHEAD.ample}
              </p>
            </div>
          </div>
        </div>

        <BookingFlow
          slug={params.service}
          initialPostcode={searchParams.postcode ?? ""}
          brandSlug={brandSlug}
        />
      </div>
    </div>
  );
}
