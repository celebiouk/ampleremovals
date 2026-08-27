"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Landmark, CheckCircle2, Phone, XCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyRow } from "@/components/shared/CopyRow";
import { cardTotalForNet } from "@/lib/stripe-fees";

const PHONE_DISPLAY = "0333 577 2070";
const PHONE_TEL = "03335772070";

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

interface PayData {
  firstName: string;
  reference: string;
  amount: number;
  paid: boolean;
  bank: { accountName: string; sortCode: string; accountNumber: string } | null;
}

type Stage = "loading" | "ready" | "claiming" | "done" | "paid" | "error";

export default function PayPage() {
  const { code } = useParams<{ code: string }>();
  const [stage, setStage] = useState<Stage>("loading");
  const [data, setData] = useState<PayData | null>(null);
  const [error, setError] = useState("");
  const [cardLoading, setCardLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Returning from a successful Stripe Checkout → show a thank-you while the
    // webhook confirms the payment in the background.
    const cardSuccess = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("status") === "card_success";
    (async () => {
      try {
        const res = await fetch(`/api/pay/${code}`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok || !body.success) { setError(body.error || "We couldn't find that payment link."); setStage("error"); return; }
        setData(body);
        setStage(body.paid ? "paid" : cardSuccess ? "done" : "ready");
      } catch {
        if (!cancelled) { setError("Network error. Please try again."); setStage("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const payByCard = useCallback(async () => {
    setCardLoading(true);
    try {
      const res = await fetch(`/api/pay/${code}/checkout`, { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success || !body.url) { setError(body.error || "Couldn't start card payment."); setStage("error"); return; }
      window.location.href = body.url as string; // → Stripe hosted checkout
    } catch {
      setError("Network error. Please try again."); setStage("error");
    } finally {
      setCardLoading(false);
    }
  }, [code]);

  const claim = useCallback(async () => {
    setStage("claiming");
    try {
      const res = await fetch(`/api/pay/${code}/claim`, { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success) { setError(body.error || "Something went wrong."); setStage("error"); return; }
      setStage("done");
    } catch {
      setError("Network error. Please try again."); setStage("error");
    }
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 px-4 py-12">
      <div className="w-full max-w-md">
        {stage === "loading" && (
          <div className="flex flex-col items-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple-700" />
            <p className="mt-3">Loading your invoice…</p>
          </div>
        )}

        {(stage === "ready" || stage === "claiming") && data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-100">
                <Landmark className="h-7 w-7 text-brand-purple-800" />
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-purple-950">
                Pay your balance
              </h1>
              <p className="mt-2 text-slate-500">
                Hi {data.firstName}, your balance is <strong className="text-brand-purple-900">{gbp(data.amount)}</strong>. Choose how you&apos;d like to pay:
              </p>
            </div>

            {/* Option 1 — Pay by card (instant) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-purple-700" />
                <h2 className="font-display text-lg font-bold text-brand-purple-950">Pay by card</h2>
                <span className="ml-auto rounded-full bg-brand-green-100 px-2 py-0.5 text-xs font-semibold text-brand-green-700">Instant</span>
              </div>
              <p className="mb-4 text-sm text-slate-500">Secure card payment via Stripe. Your booking is confirmed the moment it clears.</p>
              <Button
                onClick={payByCard}
                size="lg"
                disabled={cardLoading}
                className="h-14 w-full rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500 disabled:opacity-60"
              >
                {cardLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Opening secure checkout…</> : <>Pay {gbp(cardTotalForNet(data.amount).total)} by card</>}
              </Button>
              {cardTotalForNet(data.amount).fee > 0 && (
                <p className="mt-2 text-center text-xs text-slate-400">
                  Includes a {gbp(cardTotalForNet(data.amount).fee)} card processing fee so your full {gbp(data.amount)} reaches us. Prefer no fee? Use bank transfer below.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or pay by bank transfer <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Option 2 — Bank transfer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-brand-purple-700" />
                <h2 className="font-display text-lg font-bold text-brand-purple-950">Bank transfer</h2>
              </div>
              {data.bank ? (
                <dl className="divide-y divide-slate-100">
                  <CopyRow label="Amount" value={gbp(data.amount)} strong />
                  <CopyRow label="Account name" value={data.bank.accountName} />
                  <CopyRow label="Sort code" value={data.bank.sortCode} />
                  <CopyRow label="Account number" value={data.bank.accountNumber} />
                  <CopyRow label="Reference" value={data.reference} />
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  Please call us on <a href={`tel:${PHONE_TEL}`} className="font-semibold text-brand-purple-800">{PHONE_DISPLAY}</a> to pay your balance.
                </p>
              )}
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Use <strong>{data.reference}</strong> as your payment reference so we can match your transfer.
              </div>
              <Button
                onClick={claim}
                size="lg"
                disabled={stage === "claiming"}
                variant="outline"
                className="mt-4 h-12 w-full rounded-xl border-2 border-brand-purple-200 text-base font-bold text-brand-purple-800 hover:bg-brand-purple-50 disabled:opacity-60"
              >
                {stage === "claiming" ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting…</> : "I've made the bank transfer"}
              </Button>
              <p className="mt-2 text-center text-xs text-slate-400">We&apos;ll confirm your transfer once it lands.</p>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto mb-6 mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-100">
              <CheckCircle2 className="h-12 w-12 text-brand-green-600" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-brand-purple-950">Thank you!</h1>
            <p className="mx-auto mt-3 max-w-sm text-slate-500">
              We&apos;ve noted your payment and a team member will confirm it once it lands. Need us? Call {PHONE_DISPLAY}.
            </p>
            <a href={`tel:${PHONE_TEL}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-600 px-5 py-3 font-semibold text-white hover:bg-brand-green-500">
              <Phone className="h-4 w-4" /> Call us
            </a>
          </motion.div>
        )}

        {stage === "paid" && (
          <div className="text-center">
            <div className="mx-auto mb-6 mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-100">
              <CheckCircle2 className="h-8 w-8 text-brand-green-600" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-brand-purple-950">This balance is settled</h1>
            <p className="mt-3 text-slate-500">Thank you — nothing more to pay. Questions? Call {PHONE_DISPLAY}.</p>
          </div>
        )}

        {stage === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-6 mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-brand-purple-950">Something went wrong</h1>
            <p className="mx-auto mt-3 max-w-sm text-slate-500">{error}</p>
            <a href={`tel:${PHONE_TEL}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-purple-200 px-5 py-3 font-semibold text-brand-purple-800 hover:bg-brand-purple-50">
              <Phone className="h-4 w-4" /> Call us on {PHONE_DISPLAY}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
