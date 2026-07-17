"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, X, Plus, Phone, ShieldCheck,
  CalendarCheck, Truck, Sparkles, Landmark, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPOSIT_PERCENTAGE, BANK_DETAILS, BANK_DETAILS_CONFIGURED } from "@/lib/deposit";

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

interface QuoteData {
  reference: string;
  firstName: string;
  lines: QuoteLine[];
  total: number;
  deposit: number;
  depositStatus: string;
  status: string;
  hasQuote: boolean;
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

  const [stage, setStage] = useState<Stage>("loading");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(0);

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
        // Resume where they left off: already paid/claimed → done; already
        // reserved (deposit invoice sent) → straight to the deposit screen.
        if (data.depositStatus === "claimed" || data.depositStatus === "verified" || data.status === "deposit_paid_job_confirmed") {
          setStage("done");
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

  const toggleLine = useCallback((key: string) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Live totals as the customer edits (base + white-goods uplift stay hidden inside
  // the base line, which is never removable).
  const { liveTotal, liveDeposit } = useMemo(() => {
    if (!quote) return { liveTotal: 0, liveDeposit: 0 };
    const t = quote.lines
      .filter((l) => !removed.has(l.key))
      .reduce((sum, l) => sum + l.total, 0);
    return { liveTotal: t, liveDeposit: Math.round(t * (DEPOSIT_PERCENTAGE / 100) * 100) / 100 };
  }, [quote, removed]);

  const reserve = async () => {
    setStage("reserving");
    try {
      const res = await fetch("/api/quote/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token, removedKeys: Array.from(removed) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Couldn't reserve your date."); setStage("error"); return; }
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
            <LoadingView key="loading" message={stage === "loading" ? LOADING_MESSAGES[loadingMsg] : stage === "reserving" ? "Reserving your date…" : "Confirming your payment…"} />
          )}

          {stage === "reveal" && quote && (
            <RevealView
              key="reveal"
              quote={quote}
              removed={removed}
              onToggle={toggleLine}
              liveTotal={liveTotal}
              liveDeposit={liveDeposit}
              onReserve={reserve}
            />
          )}

          {stage === "deposit" && quote && (
            <DepositView key="deposit" reference={quote.reference} deposit={liveDeposit || quote.deposit} onClaim={claimDeposit} />
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
function LoadingView({ message }: { message: string }) {
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
        Getting you the best quote
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
  quote, removed, onToggle, liveTotal, liveDeposit, onReserve,
}: {
  quote: QuoteData;
  removed: Set<string>;
  onToggle: (key: string) => void;
  liveTotal: number;
  liveDeposit: number;
  onReserve: () => void;
}) {
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
        <div className="space-y-2.5">
          {quote.lines.map((line) => {
            const isRemoved = removed.has(line.key);
            return (
              <div
                key={line.key}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  isRemoved ? "bg-slate-50" : "bg-white"
                }`}
              >
                <span className={`text-sm ${isRemoved ? "text-slate-400 line-through" : "font-medium text-slate-800"}`}>
                  {line.description}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm tabular-nums ${isRemoved ? "text-slate-400 line-through" : "font-semibold text-slate-900"}`}>
                    {gbp(line.total)}
                  </span>
                  {line.removable && (
                    <button
                      type="button"
                      onClick={() => onToggle(line.key)}
                      aria-label={isRemoved ? `Add ${line.description}` : `Remove ${line.description}`}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                        isRemoved
                          ? "border-brand-green-300 text-brand-green-600 hover:bg-brand-green-50"
                          : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500"
                      }`}
                    >
                      {isRemoved ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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

      <Button
        onClick={onReserve}
        size="lg"
        className="mt-5 h-14 w-full rounded-xl bg-brand-green-600 text-base font-bold text-white shadow-lg shadow-brand-green-200 hover:bg-brand-green-500"
      >
        Reserve My Moving Date
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" /> No card needed now · Free to reserve · Pay the deposit by bank transfer
      </p>
    </motion.div>
  );
}

/* ── Deposit (bank transfer) ──────────────────────────────── */
function DepositView({ reference, deposit, onClaim }: { reference: string; deposit: number; onClaim: () => void }) {
  const rows = [
    { label: "Account name", value: BANK_DETAILS.accountName },
    { label: "Sort code", value: BANK_DETAILS.sortCode },
    { label: "Account number", value: BANK_DETAILS.accountNumber },
    { label: "Payment reference", value: reference },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple-100">
          <Landmark className="h-7 w-7 text-brand-purple-800" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-purple-950">
          Lock in your date
        </h1>
        <p className="mt-2 text-slate-500">
          Send your <strong className="text-brand-purple-900">{gbp(deposit)}</strong> deposit by bank transfer to secure your move.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
        {BANK_DETAILS_CONFIGURED ? (
          <dl className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-3">
                <dt className="text-sm text-slate-500">{r.label}</dt>
                <dd className="font-display text-base font-bold tracking-wide text-brand-purple-950">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">
            Please call us on <a href={`tel:${PHONE_TEL}`} className="font-semibold text-brand-purple-800">{PHONE_DISPLAY}</a> to pay your deposit and lock in your date.
          </p>
        )}
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Use <strong>{reference}</strong> as your payment reference so we can match your transfer.
        </div>
      </div>

      <Button
        onClick={onClaim}
        size="lg"
        className="mt-5 h-14 w-full rounded-xl bg-brand-purple-800 text-base font-bold text-white shadow-lg shadow-brand-purple-200 hover:bg-brand-purple-900"
      >
        I&apos;ve made the payment
      </Button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Your date is held while we confirm your transfer.
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
        A member of our team will confirm your transfer and be in touch shortly to finalise everything for your move.
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
