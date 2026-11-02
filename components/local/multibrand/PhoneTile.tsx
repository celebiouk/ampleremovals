"use client";

import { Phone } from "lucide-react";
import { trackPhoneClick } from "@/lib/analytics/track";

/** The "Call" tile on BrandContactPage — its own tiny client component so
 *  the click-tracking handler doesn't force the whole (async server)
 *  BrandContactPage to become a client component. */
export function PhoneTile({
  phone,
  phoneHref,
  color,
  source,
}: {
  phone: string;
  phoneHref: string;
  color: string;
  source: string;
}) {
  return (
    <a
      href={phoneHref}
      onClick={() => trackPhoneClick(source)}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-6 text-center hover:border-slate-300"
    >
      <Phone className="h-6 w-6" style={{ color }} />
      <p className="font-display font-bold text-slate-900">Call</p>
      <p className="text-sm text-slate-600">{phone}</p>
    </a>
  );
}
