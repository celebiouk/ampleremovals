"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, MapPin, Loader2, AlertCircle, Home } from "lucide-react";
import { toast } from "sonner";

interface AddressDetails {
  id: string;
  line_1: string;
  line_2?: string;
  city?: string;
  postcode: string;
  full: string;
}

interface BookingDetails {
  id: string;
  reference: string;
  service_type: string;
  move_date: string;
  customer_name: string;
  origin_address: AddressDetails;
  destination_address: AddressDetails;
}

export default function ConfirmAddressPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch("/api/address-confirm/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, token }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Invalid confirmation link");
          setLoading(false);
          return;
        }

        if (data.already_confirmed) {
          setAlreadyConfirmed(true);
          setLoading(false);
          return;
        }

        setBookingDetails(data.booking);
        setLoading(false);
      } catch {
        setError("Failed to load booking details");
        setLoading(false);
      }
    };

    validateToken();
  }, [bookingId, token]);

  const handleConfirm = async () => {
    setConfirming(true);

    try {
      const res = await fetch("/api/address-confirm/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Addresses confirmed successfully!");
        setAlreadyConfirmed(true);
      } else {
        toast.error(data.error || "Failed to confirm addresses");
      }
    } catch {
      toast.error("Failed to confirm addresses");
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-purple-600" />
          <p className="mt-4 text-lg text-slate-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Invalid Link</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-brand-purple-700 px-6 py-3 font-semibold text-white hover:bg-brand-purple-800"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Already confirmed state
  if (alreadyConfirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Addresses Confirmed!</h1>
          <p className="mt-2 text-slate-600">
            Thank you! Your addresses have been confirmed. We&apos;ll see you soon!
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-brand-purple-700 px-6 py-3 font-semibold text-white hover:bg-brand-purple-800"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Main confirmation UI
  if (!bookingDetails) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 to-white p-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-100">
            <Home className="h-8 w-8 text-brand-purple-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Confirm Your Addresses</h1>
          <p className="mt-2 text-lg text-slate-600">
            Hi {bookingDetails.customer_name}, your move is today!
          </p>
          <p className="text-sm text-slate-500">Booking: {bookingDetails.reference}</p>
        </div>

        {/* Addresses Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <p className="mb-6 text-center text-slate-600">
            Please review and confirm your addresses are correct:
          </p>

          {/* Origin Address */}
          <div className="mb-6 rounded-xl border-2 border-green-500 bg-green-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900">Pick-up Address</span>
            </div>
            <p className="text-slate-700">{bookingDetails.origin_address.full}</p>
          </div>

          {/* Destination Address */}
          <div className="mb-6 rounded-xl border-2 border-blue-500 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Delivery Address</span>
            </div>
            <p className="text-slate-700">{bookingDetails.destination_address.full}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Yes, Addresses Are Correct
                </>
              )}
            </button>

            <button
              onClick={() => setShowChangeForm(true)}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-bold text-slate-700 hover:bg-slate-50"
            >
              Address Needs Changing
            </button>
          </div>
        </div>

        {/* Change Form (Simple for now - will enhance with postcode lookup) */}
        {showChangeForm && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">Update Addresses</h3>
            <p className="mb-4 text-sm text-slate-600">
              Please call us to update your addresses: <a href="tel:03335772070" className="font-bold text-brand-purple-700 hover:underline">0333 577 2070</a>
            </p>
            <button
              onClick={() => setShowChangeForm(false)}
              className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
