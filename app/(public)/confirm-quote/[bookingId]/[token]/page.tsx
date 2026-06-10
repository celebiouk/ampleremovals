"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmationState = "loading" | "confirming" | "success" | "error" | "already_confirmed" | "invalid";

export default function ConfirmQuotePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const token = params.token as string;

  const [state, setState] = useState<ConfirmationState>("loading");
  const [quoteDetails, setQuoteDetails] = useState<{
    reference: string;
    service_type: string;
    total: number;
    customer_name: string;
    deposit_required: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const validateQuote = async () => {
      try {
        const res = await fetch(`/api/quote-confirm/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, token }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.code === "ALREADY_CONFIRMED") {
            setState("already_confirmed");
          } else if (data.code === "INVALID_TOKEN" || data.code === "EXPIRED") {
            setState("invalid");
            setErrorMessage(data.error || "Invalid or expired confirmation link");
          } else {
            setState("error");
            setErrorMessage(data.error || "Failed to validate quote");
          }
          return;
        }

        setQuoteDetails(data.quote);
        setState("loading"); // Ready to confirm
      } catch (error) {
        console.error("Validation error:", error);
        setState("error");
        setErrorMessage("Network error. Please try again.");
      }
    };

    validateQuote();
  }, [bookingId, token]);

  const handleConfirm = async () => {
    setState("confirming");

    try {
      const res = await fetch(`/api/quote-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error || "Failed to confirm quote");
        return;
      }

      setState("success");
    } catch (error) {
      console.error("Confirmation error:", error);
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        {/* Loading state */}
        {state === "loading" && quoteDetails && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-brand-purple-100 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-brand-purple-800" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-foreground mb-3">
              Confirm Your Quote
            </h1>
            <p className="text-muted-foreground mb-8">
              You&apos;re about to confirm your booking for <strong>{quoteDetails.service_type}</strong>
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Booking Reference</span>
                  <span className="font-semibold">{quoteDetails.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <span className="font-semibold">{quoteDetails.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="font-semibold">{quoteDetails.customer_name}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Quoted</span>
                  <span className="text-xl font-bold text-brand-purple-800">
                    £{quoteDetails.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-900">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Your booking will be confirmed</li>
                {quoteDetails?.deposit_required ? (
                  <>
                    <li>We&apos;ll send you a deposit invoice to secure your booking</li>
                    <li>Once the deposit is paid, you&apos;ll receive full confirmation details</li>
                  </>
                ) : (
                  <>
                    <li>You&apos;ll receive full confirmation details by email</li>
                    <li>Full payment will be due on completion of the service</li>
                  </>
                )}
              </ul>
            </div>

            <Button
              onClick={handleConfirm}
              size="lg"
              className="w-full bg-brand-purple-800 hover:bg-brand-purple-900 text-white font-semibold"
            >
              Yes, Confirm This Quote
            </Button>
          </div>
        )}

        {/* Confirming state */}
        {state === "confirming" && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-brand-purple-800 mx-auto mb-4" />
            <p className="text-muted-foreground">Confirming your quote...</p>
          </div>
        )}

        {/* Success state */}
        {state === "success" && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-6 flex justify-center"
            >
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </motion.div>
            <h1 className="font-display text-3xl font-extrabold text-foreground mb-3">
              Quote Confirmed!
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for confirming your quote. {quoteDetails?.deposit_required
                ? "We've sent you a deposit invoice by email."
                : "We've received your confirmation."
              }
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
              <p className="text-sm font-semibold text-green-900 mb-2">Next Steps:</p>
              <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                {quoteDetails?.deposit_required ? (
                  <>
                    <li>Check your email for the deposit invoice</li>
                    <li>Pay the deposit to secure your booking</li>
                    <li>We&apos;ll contact you with arrival details</li>
                  </>
                ) : (
                  <>
                    <li>Check your email for confirmation details</li>
                    <li>We&apos;ll contact you to finalize arrangements</li>
                    <li>Full payment will be due on completion</li>
                  </>
                )}
              </ol>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => window.location.href = "tel:03335772070"}
                className="w-full bg-brand-green-600 hover:bg-brand-green-500 text-white"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Us
              </Button>
            </div>
          </div>
        )}

        {/* Already confirmed */}
        {state === "already_confirmed" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-foreground mb-3">
              Already Confirmed
            </h1>
            <p className="text-muted-foreground mb-6">
              This quote has already been confirmed. {quoteDetails?.deposit_required
                ? "Check your email for the deposit invoice."
                : "Check your email for confirmation details."
              }
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        )}

        {/* Error states */}
        {(state === "invalid" || state === "error") && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-foreground mb-3">
              {state === "invalid" ? "Invalid Link" : "Something Went Wrong"}
            </h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <p className="text-sm font-semibold mb-2">Need help?</p>
              <div className="space-y-2">
                <a
                  href="tel:03335772070"
                  className="flex items-center justify-center gap-2 text-sm text-brand-purple-800 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  Call us: 03335772070
                </a>
                <a
                  href="mailto:bookings@ampleremovals.com"
                  className="flex items-center justify-center gap-2 text-sm text-brand-purple-800 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Email: bookings@ampleremovals.com
                </a>
              </div>
            </div>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
