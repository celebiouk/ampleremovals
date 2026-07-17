import Link from "next/link";
import { Phone, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { CompletionFlow } from "@/components/booking/CompletionFlow";

export const dynamic = "force-dynamic";

const TOKEN_EXPIRY_HOURS = 24 * 30;

export const metadata = { title: "Complete your quote — Ample Removals" };

/**
 * Self-service completion page for an admin-created lead. Validates the signed
 * token server-side, greets the customer by name, and drops them into the
 * pre-filled Removals wizard (completion mode).
 */
export default async function CompleteLeadPage({
  params,
}: {
  params: { bookingId: string; token: string };
}) {
  const { bookingId, token } = params;
  const valid = verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS);

  let customer: { full_name: string; email: string; phone: string } | null = null;
  if (valid) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("bookings")
      .select("customer:customers!inner(full_name, email, phone)")
      .eq("id", bookingId)
      .single();
    const c = data?.customer;
    customer = (Array.isArray(c) ? c[0] : c) ?? null;
  }

  if (!valid || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ff] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="font-display text-2xl font-extrabold text-brand-purple-950">
            This link isn&apos;t valid
          </h1>
          <p className="mt-3 text-slate-500">
            It may have expired. Please get in touch and we&apos;ll sort out your quote.
          </p>
          <a
            href="tel:03335772070"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple-800 px-5 py-3 font-semibold text-white hover:bg-brand-purple-900"
          >
            <Phone className="h-4 w-4" /> Call us on 0333 577 2070
          </a>
        </div>
      </div>
    );
  }

  const firstName = customer.full_name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f5f3ff] pb-24 pt-24 sm:pb-16 sm:pt-28">
      <div className="container">
        <div className="mx-auto mb-8 max-w-[680px]">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple-800 text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">
                Hi {firstName}, let&apos;s finish your quote
              </h1>
              <p className="text-sm text-slate-500">
                We&apos;ve got your contact details — just a few quick questions and your instant price.
              </p>
            </div>
          </div>
        </div>

        <CompletionFlow
          bookingId={bookingId}
          token={token}
          defaults={{ fullName: customer.full_name, email: customer.email, phone: customer.phone }}
        />
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">
        Not you, or need help?{" "}
        <Link href="tel:03335772070" className="font-semibold text-brand-purple-700">
          Call 0333 577 2070
        </Link>
      </p>
    </div>
  );
}
