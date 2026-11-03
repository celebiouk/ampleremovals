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
  className = "flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-6 text-center hover:border-slate-300",
  iconClassName,
  titleClassName = "font-display font-bold text-slate-900",
  bodyClassName = "text-sm text-slate-600",
}: {
  phone: string;
  phoneHref: string;
  /** Icon colour for the default (unthemed) tile. */
  color?: string;
  source: string;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <a
      href={phoneHref}
      onClick={() => trackPhoneClick(source)}
      className={className}
    >
      <Phone className={`h-6 w-6 ${iconClassName ?? ""}`} style={iconClassName ? undefined : { color }} />
      <p className={titleClassName}>Call</p>
      <p className={bodyClassName}>{phone}</p>
    </a>
  );
}
