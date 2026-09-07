"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Phone, ShieldCheck,
  CalendarCheck, Truck, Sparkles, Landmark, XCircle, Check, Star,
  CreditCard, Wallet, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDelayedBookingNotify } from "@/hooks/useDelayedBookingNotify";
import { CopyRow } from "@/components/shared/CopyRow";
import { DEPOSIT_PERCENTAGE, BANK_DETAILS, BANK_DETAILS_CONFIGURED } from "@/lib/deposit";
import { premiumTotalFor, PREMIUM_INCLUDES, STANDARD_INCLUDES, TIER_COPY } from "@/lib/tiers";

const gbp0 = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n || 0);

const PHONE_DISPLAY = "0333 577 2070";
const PHONE_TEL = "03335772070";

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

interface QuoteLine {
  key: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  removable: boolean;
}

interface QuoteCrew {
  men: number;
  vanCount: number;
  line: string;
  blurb: string;
}

interface QuoteData {
  reference: string;
  firstName: string;
  lines: QuoteLine[];
  total: number;
  deposit: number;
  depositStatus: string;
  status: string;
  hasQuote: boolean;
  crew?: QuoteCrew;
  premiumCrewLine?: string;
  premiumMultiplier?: number;
}

type Stage = "loading" | "reveal" | "reserving" | "deposit" | "claiming" | "done" | "error";

const LOADING_MESSAGES = [
  "Checking crew availability…",
  "Sizing up your move…",
  "Finding your best price…",
  "Putting your quote together…",
];

const MIN_LOADING_MS = 4500;

export default function QuotePage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const token = params.token as string;
  // The customer's quote/confirmation email+SMS fires from THIS page, ~60s
  // after they land here (or sooner if they navigate away) — not the instant
  // they submitted the booking. Safe on every visit (idempotent server-side).
  useDelayedBookingNotify(bookingId, token);

  const [stage, setStage] = useState<Stage>("loading");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  // The customer sees only the total (no per-line breakdown), so there is nothing
  // to remove — kept as a stable empty set for the reserve payload + total calc.
  const removed = useMemo(() => new Set<string>(), []);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(0);
  // The reserved figures (server-computed for the chosen tier) — drive the deposit
  // (card/bank) and full (Klarna) payment amounts.
  const [reserved, setReserved] = useState<{ total: number; deposit: number }>({ total: 0, deposit: 0 });
  // Why the customer arrived — so the loading screen says what they're actually
  // waiting for (a fresh quote vs. a payment they clicked from an email/text).
  const [entryContext] = useState<"quote" | "tier" | "paid">(() => {
    if (typeof window === "undefined") return "quote";
    const p = new URLSearchParams(window.location.search);
    if (p.get("paid") === "1") return "paid";
    if (p.get("tier")) return "tier";
    return "quote";
  });

  // Rotate the reassuring loading messages.
  useEffect(() => {
    if (stage !== "loading") return;
    const id = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 1300);
    return () => clearInterval(id);
  }, [stage]);

  // Fetch the quote, holding the loading screen for a minimum beat for effect.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const started = Date.now();
      try {
        const res = await fetch("/api/quote/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, token }),
        });
        const data = await res.json();
        const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - started));
        await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error || "We couldn't load your quote.");
          setStage("error");
          return;
        }
        setQuote(data);
        // Just came back from a successful card/Klarna checkout → thank them
        // immediately (the webhook confirms in the background).
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const justPaid = params.get("paid") === "1";
        const tierParam = params.get("tier");
        // Resume where they left off: already paid/claimed → done; a tier link
        // from the quote email → reserve that tier and go to payment; already
        // reserved → the deposit screen.
        if (justPaid || data.depositStatus === "claimed" || data.depositStatus === "verified" || data.status === "deposit_paid_job_confirmed" || data.status === "full_balance_paid") {
          setStage("done");
        } else if ((tierParam === "standard" || tierParam === "premium") && data.hasQuote) {
          reserve(tierParam);
        } else if (data.status === "deposit_invoice_sent") {
          setStage("deposit");
        } else if (!data.hasQuote) {
          setError("quote-pending"); setStage("error");
        } else {
          setStage("reveal");
        }
      } catch {
        if (!cancelled) { setError("Network error. Please try again."); setStage("error"); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bookingId, token]);

  // Total the customer sees (base + items + distance + any add-ons), with the
  // breakdown deliberately hidden — a single fixed price, no line-by-line prices.
  const { liveTotal, liveDeposit } = useMemo(() => {
    if (!quote) return { liveTotal: 0, liveDeposit: 0 };
    const t = quote.lines
      .filter((l) => !removed.has(l.key))
      .reduce((sum, l) => sum + l.total, 0);
    return { liveTotal: t, liveDeposit: Math.round(t * (DEPOSIT_PERCENTAGE / 100) * 100) / 100 };
  }, [quote, removed]);

  const reserve = async (tier: "standard" | "premium" = "standard") => {
    setStage("reserving");
    try {
      const res = await fetch("/api/quote/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token, removedKeys: Array.from(removed), tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Couldn't reserve your date."); setStage("error"); return; }
      setReserved({ total: Number(data.total) || liveTotal, deposit: Number(data.deposit) || liveDeposit });
      setStage("deposit");
    } catch {
      setError("Network error. Please try again."); setStage("error");
    }
  };

  const claimDeposit = async () => {
    setStage("claiming");
    try {
      const res = await fetch("/api/deposit/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Something went wrong."); setStage("error"); return; }
      setStage("done");
    } catch {
      setError("Network error. Please try again."); setStage("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <AnimatePresence mode="wait">
          {(stage === "loading" || stage === "reserving" || stage === "claiming") && (
            <LoadingView
              key="loading"
              heading={
                stage === "reserving" ? "Reserving your date"
                : stage === "claiming" ? "Confirming your payment"
                : entryContext === "paid" ? "Confirming your payment"
                : entryContext === "tier" ? "Setting up your booking"
                : "Getting you the best quote"
              }
              message={
                stage === "reserving" ? "Locking in your date…"
                : stage === "claiming" ? "Just a moment…"
                : entryContext === "paid" ? "Finishing up your payment…"
                : entryContext === "tier" ? "Preparing your booking…"
                : LOADING_MESSAGES[loadingMsg]
              }
            />
          )}

          {stage === "reveal" && quote && (
            <RevealView
              key="reveal"
              quote={quote}
              liveTotal={liveTotal}
              liveDeposit={liveDeposit}
              onReserve={reserve}
            />
          )}

          {stage === "deposit" && quote && (
            <DepositView
              key="deposit"
              bookingId={bookingId}
              token={token}
              reference={quote.reference}
              deposit={reserved.deposit || liveDeposit || quote.deposit}
              fullTotal={reserved.total || liveTotal || quote.total}
              onClaim={claimDeposit}
              onError={(m) => { setError(m); setStage("error"); }}
            />
          )}

          {stage === "done" && quote && <DoneView key="done" firstName={quote.firstName} reference={quote.reference} />}

          {stage === "error" && (
            <ErrorView key="error" pending={error === "quote-pending"} message={error} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Loading ──────────────────────────────────────────────── */
function LoadingView({ heading, message }: { heading: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-purple-800 shadow-xl shadow-brand-purple-200">
          <Truck className="h-11 w-11 text-white" />
        </div>
        <motion.div
          className="absolute -inset-3 rounded-[2rem] border-2 border-brand-purple-300"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
      <h1 className="font-display text-2xl font-extrabold text-brand-purple-950">
        {heading}
      </h1>
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="mt-3 flex items-center gap-2 text-slate-500"
        >
          <Loader2 className="h-4 w-4 animate-spin" /> {message}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Quote reveal (editable) ──────────────────────────────── */
function RevealView({
  quote, liveTotal, liveDeposit, onReserve,
}: {
  quote: QuoteData;
  liveTotal: number;
  liveDeposit: number;
  onReserve: (tier: "standard" | "premium") => void;
}) {
  const premiumTotal = quote.premiumMultiplier
    ? Math.round(liveTotal * quote.premiumMultiplier * 100) / 100
    : premiumTotalFor(liveTotal);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green-100"
        >
          <Sparkles className="h-7 w-7 text-brand-green-600" />
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-purple-950">
          Your quote is ready, {quote.firstName}
        </h1>
        <p className="mt-2 text-slate-500">Fixed price, no hidden fees. Tailor it below.</p>
      </div>

      <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">Choose your package</p>
      {/* ── Standard ── */}
      <div className="rounded-2xl border-2 border-brand-purple-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-brand-purple-700" />
          <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.standard.name}</h2>
        </div>
        <p className="mb-3 text-sm text-slate-500">{TIER_COPY.standard.tagline}</p>
        {/* One fixed price — the breakdown (crew & van, your items, distance) is
            deliberately hidden; the customer sees only what's included and the total. */}
        <ul className="space-y-1.5">
          {STANDARD_INCLUDES.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Crew & van — "what you get", shown INSIDE the Standard package. */}
        {quote.crew && (
          <div className="mt-3 rounded-xl bg-brand-purple-50/70 px-4 py-3">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-purple-800">
              <ShieldCheck className="h-4 w-4" /> {quote.crew.line}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{quote.crew.blurb}</p>
          </div>
        )}

        <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
          <div className="flex items-end justify-between">
            <span className="font-display text-lg font-bold text-brand-purple-950">Total</span>
            <motion.span
              key={liveTotal}
              initial={{ scale: 1.15 }} animate={{ scale: 1 }}
              className="font-display text-3xl font-extrabold tabular-nums text-brand-purple-900"
            >
              {gbp(liveTotal)}
            </motion.span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-green-50 px-4 py-3 text-sm text-brand-green-800">
            <CalendarCheck className="h-5 w-5 shrink-0" />
            <span>
              Reserve today with a <strong>{DEPOSIT_PERCENTAGE}% deposit of {gbp(liveDeposit)}</strong> — the rest is due on moving day.
            </span>
          </div>
        </div>
      </div>

      {/* ── Premium ── */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-brand-purple-600 bg-white p-5 shadow-xl shadow-brand-purple-200/50 sm:p-6">
        <span className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-brand-purple-800 px-3 py-1 text-xs font-bold text-white">
          <Star className="h-3.5 w-3.5" /> RECOMMENDED
        </span>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-purple-700" />
          <h2 className="font-display text-lg font-extrabold text-brand-purple-950">{TIER_COPY.premium.name}</h2>
        </div>
        <p className="mb-3 text-sm text-slate-500">{TIER_COPY.premium.tagline}</p>
        <p className="mb-3 font-display text-3xl font-extrabold tabular-nums text-brand-purple-900">{gbp0(premiumTotal)}</p>
        {quote.premiumCrewLine && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-purple-100/70 px-3 py-1.5 text-sm font-semibold text-brand-purple-800">
            <ShieldCheck className="h-4 w-4" /> {quote.premiumCrewLine}
          </p>
        )}
        <ul className="space-y-1.5">
          {PREMIUM_INCLUDES.map((f, i) => (
            <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-semibold text-slate-700" : "text-slate-600"}`}>
              {i === 0 ? <span className="w-4" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />}
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-2.5">
        <Button
          onClick={() => onReserve("standard")}
          size="lg"
          className="h-14 w-full rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500"
        >
          I&apos;m booking Standard — {gbp0(liveTotal)}
        </Button>
        <Button
          onClick={() => onReserve("premium")}
          size="lg"
          className="h-14 w-full rounded-xl bg-brand-purple-800 text-base font-bold text-white shadow-lg shadow-brand-purple-200 hover:bg-brand-purple-900"
        >
          I&apos;m booking Premium — {gbp0(premiumTotal)}
        </Button>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" /> No card needed now · Free to reserve · Pay the deposit by bank transfer
      </p>
    </motion.div>
  );
}

/* ── Deposit / payment (card · Klarna · bank) ─────────────── */
function DepositView({
  bookingId, token, reference, deposit, fullTotal, onClaim, onError,
}: {
  bookingId: string;
  token: string;
  reference: string;
  deposit: number;
  fullTotal: number;
  onClaim: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<"card" | "klarna" | null>(null);
  const [showBank, setShowBank] = useState(false);
  const klarnaInstalment = Math.round((fullTotal / 3) * 100) / 100;

  const rows = [
    { label: "Account name", value: BANK_DETAILS.accountName },
    { label: "Sort code", value: BANK_DETAILS.sortCode },
    { label: "Account number", value: BANK_DETAILS.accountNumber },
    { label: "Payment reference", value: reference },
  ];

  // Kick off a Stripe Checkout for card (deposit) or Klarna (full ÷3).
  const startCheckout = async (method: "card" | "klarna") => {
    setBusy(method);
    try {
      const res = await fetch(`/api/quote/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, method }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) throw new Error(data.error || "Couldn't start payment.");
      window.location.href = data.url as string;
    } catch (e) {
      setBusy(null);
      onError(e instanceof Error ? e.message : "Couldn't start payment.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-100">
          <ShieldCheck className="h-7 w-7 text-brand-purple-800" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-purple-950">
          Lock in your date
        </h1>
        <p className="mt-2 text-slate-500">Choose how you&apos;d like to pay — your date is held as soon as you do.</p>
      </div>

      <div className="space-y-3">
        {/* Card — deposit */}
        <button
          type="button"
          onClick={() => startCheckout("card")}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-brand-purple-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-purple-400 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple-100 text-brand-purple-800">
            {busy === "card" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-bold text-brand-purple-950">Pay deposit by card</span>
            <span className="block text-sm text-slate-500">Reserve now with {gbp(deposit)} — balance due on moving day.</span>
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums text-brand-purple-900">{gbp0(deposit)}</span>
        </button>

        {/* Klarna — full in 3 */}
        <button
          type="button"
          onClick={() => startCheckout("klarna")}
          disabled={busy !== null}
          className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 border-brand-purple-600 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-purple-700 disabled:opacity-60"
        >
          <span className="absolute right-0 top-0 rounded-bl-xl bg-brand-purple-800 px-2.5 py-0.5 text-[10px] font-bold text-white">SPREAD THE COST</span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffb3c7] text-brand-purple-950">
            {busy === "klarna" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-bold text-brand-purple-950">Pay in 3 with Klarna</span>
            <span className="block text-sm text-slate-500">Split your whole move into 3 — {gbp(klarnaInstalment)} today, then 2 more.</span>
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums text-brand-purple-900">{gbp0(fullTotal)}</span>
        </button>

        {/* Bank transfer — deposit */}
        <button
          type="button"
          onClick={() => setShowBank((s) => !s)}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-bold text-brand-purple-950">Pay deposit by bank transfer</span>
            <span className="block text-sm text-slate-500">Send {gbp(deposit)} manually — no card fee.</span>
          </span>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showBank ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Bank details (revealed) */}
      <AnimatePresence>
        {showBank && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {BANK_DETAILS_CONFIGURED ? (
                <dl className="divide-y divide-slate-100">
                  {rows.map((r) => (<CopyRow key={r.label} label={r.label} value={r.value} />))}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  Please call us on <a href={`tel:${PHONE_TEL}`} className="font-semibold text-brand-purple-800">{PHONE_DISPLAY}</a> to pay your deposit and lock in your date.
                </p>
              )}
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Use <strong>{reference}</strong> as your payment reference so we can match your transfer.
              </div>
              <Button
                onClick={onClaim}
                size="lg"
                className="mt-4 h-14 w-full rounded-xl bg-brand-purple-800 text-base font-bold text-white shadow-lg shadow-brand-purple-200 hover:bg-brand-purple-900"
              >
                I&apos;ve made the bank transfer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" /> Secure payment · Card &amp; Klarna handled by Stripe
      </p>
    </motion.div>
  );
}

/* ── Done ─────────────────────────────────────────────────── */
function DoneView({ firstName, reference }: { firstName: string; reference: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
        className="mx-auto mb-6 mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-100"
      >
        <CheckCircle2 className="h-12 w-12 text-brand-green-600" />
      </motion.div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-purple-950">
        Thank you, {firstName}!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-slate-500">
        We&apos;ve got it — a member of our team will be in touch shortly to finalise everything for your move.
      </p>

      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <p className="text-sm text-slate-500">Your booking reference</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-brand-purple-900">{reference}</p>
        <a
          href={`tel:${PHONE_TEL}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-green-500"
        >
          <Phone className="h-4 w-4" /> Need us sooner? Call {PHONE_DISPLAY}
        </a>
      </div>
    </motion.div>
  );
}

/* ── Error / pending ──────────────────────────────────────── */
function ErrorView({ pending, message }: { pending: boolean; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="text-center"
    >
      <div className={`mx-auto mb-6 mt-8 flex h-16 w-16 items-center justify-center rounded-full ${pending ? "bg-brand-purple-100" : "bg-red-100"}`}>
        {pending ? <CalendarCheck className="h-8 w-8 text-brand-purple-800" /> : <XCircle className="h-8 w-8 text-red-600" />}
      </div>
      <h1 className="font-display text-2xl font-extrabold text-brand-purple-950">
        {pending ? "We're preparing your quote" : "Something went wrong"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-slate-500">
        {pending
          ? "Thanks for your request — a member of our team will be in touch very shortly with your personalised quote."
          : message || "Please try again, or give us a call and we'll sort it out."}
      </p>
      <a
        href={`tel:${PHONE_TEL}`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-purple-200 px-5 py-3 font-semibold text-brand-purple-800 transition-colors hover:bg-brand-purple-50"
      >
        <Phone className="h-4 w-4" /> Call us on {PHONE_DISPLAY}
      </a>
    </motion.div>
  );
}
