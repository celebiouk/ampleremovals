"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DollarSign, Heart, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TipDriverPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<{ id: string; reference: string } | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const presetAmounts = [5, 10, 15, 20, 30, 50];

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/tip/booking/${bookingId}`);
      const data = await res.json();

      if (data.success) {
        setBooking(data.booking);
      } else {
        toast.error("Booking not found");
      }
    } catch {
      toast.error("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < 1) {
      toast.error("Please enter a valid amount (minimum £1)");
      return;
    }

    if (amount > 500) {
      toast.error("Maximum tip amount is £500");
      return;
    }

    setProcessing(true);

    try {
      // Create Stripe checkout session
      const res = await fetch("/api/tip/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create payment");
      }
    } catch {
      toast.error("Failed to process tip");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="text-center">
          <p className="text-lg text-slate-600">Booking not found</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 to-white p-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-100">
              <Heart className="h-8 w-8 text-brand-purple-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Tip Your Driver</h1>
            <p className="mt-2 text-slate-600">
              Show your appreciation for excellent service!
            </p>
          </div>

          {/* Driver Info */}
          <div className="mt-8 rounded-xl bg-gradient-to-br from-brand-purple-50 to-purple-100 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Your driver worked hard today!</p>
                <p className="text-sm text-slate-600">Booking: {booking.reference}</p>
              </div>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-900">
              Choose Tip Amount
            </label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`rounded-xl border-2 py-3 font-semibold transition-all ${
                    selectedAmount === amount
                      ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-purple-300"
                  }`}
                >
                  £{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-900">
              Or Enter Custom Amount
            </label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="Enter amount"
                className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-4 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Minimum £1, Maximum £500</p>
          </div>

          {/* Optional Message */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-900">
              Add a Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you for the great service!"
              rows={3}
              maxLength={200}
              className="mt-2 w-full resize-none rounded-xl border-2 border-slate-200 p-4 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">{message.length}/200 characters</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleTip}
            disabled={processing || (!selectedAmount && !customAmount)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-700 px-6 py-4 font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                Send Tip {(selectedAmount || parseFloat(customAmount) || 0) > 0 && `of £${selectedAmount || customAmount}`}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
