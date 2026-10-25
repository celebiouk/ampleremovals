import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

interface Props {
  /** Where "Get a free Quote" goes — an absolute path (/booking, /booking/man-and-van)
   *  or an on-page anchor (#get-price) for templates that keep the inline widget. */
  quoteHref: string;
  whatsappMessage: string;
}

const PHONE_DISPLAY = "0333 577 2070";
const PHONE_HREF = "tel:03335772070";

/** Sticky on every village location page: "Get a free Quote" pinned top-right,
 *  WhatsApp (left) and Call (right) pinned to the bottom — visible at all
 *  times while scrolling, the three ways a visitor can act on any page. */
export function StickyQuoteBar({ quoteHref, whatsappMessage }: Props) {
  const isAnchor = quoteHref.startsWith("#");

  return (
    <>
      <div className="fixed right-4 top-20 z-40 sm:right-6">
        {isAnchor ? (
          <a
            href={quoteHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-green-600/30 transition-transform hover:-translate-y-0.5 hover:bg-brand-green-500 sm:px-5 sm:py-3 sm:text-base"
          >
            Get a free Quote <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            href={quoteHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-green-600/30 transition-transform hover:-translate-y-0.5 hover:bg-brand-green-500 sm:px-5 sm:py-3 sm:text-base"
          >
            Get a free Quote <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur sm:p-4">
        <WhatsAppButton message={whatsappMessage} className="flex-1 justify-center text-sm sm:flex-none sm:text-base" />
        <a
          href={PHONE_HREF}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-purple-800 px-4 py-3 text-sm font-bold text-brand-purple-800 transition-colors hover:bg-brand-purple-50 sm:flex-none sm:px-6 sm:text-base"
        >
          Call us
        </a>
      </div>
    </>
  );
}
