"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Booking, Customer, Address, BookingNote,
  StatusHistoryEntry, ActivityLogEntry, Invoice,
  RemovalsDetails, ManAndVanDetails, HouseClearanceDetails,
  HouseCleaningDetails, EndOfTenancyDetails, AdditionalServices,
} from "@/types";

export interface BookingDetailData {
  booking: Booking;
  customer: Customer;
  originAddress: Address | null;
  destinationAddress: Address | null;
  removalsDetails: RemovalsDetails | null;
  manAndVanDetails: ManAndVanDetails | null;
  houseClearanceDetails: HouseClearanceDetails | null;
  houseCleaningDetails: HouseCleaningDetails | null;
  endOfTenancyDetails: EndOfTenancyDetails | null;
  additionalServices: AdditionalServices | null;
  notes: BookingNote[];
  statusHistory: StatusHistoryEntry[];
  activityLog: ActivityLogEntry[];
  invoices: Invoice[];
}

export function useBookingDetail(bookingId: string) {
  const [data, setData] = useState<BookingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingErr || !booking) {
        setError("Booking not found");
        setIsLoading(false);
        return;
      }

      const [
        { data: customer },
        { data: originAddress },
        { data: destinationAddress },
        { data: removalsDetails },
        { data: manAndVanDetails },
        { data: houseClearanceDetails },
        { data: houseCleaningDetails },
        { data: endOfTenancyDetails },
        { data: additionalServices },
        { data: notes },
        { data: statusHistory },
        { data: activityLog },
        { data: invoices },
      ] = await Promise.all([
        supabase.from("customers").select("*").eq("id", booking.customer_id).single(),
        booking.origin_address_id
          ? supabase.from("addresses").select("*").eq("id", booking.origin_address_id).single()
          : Promise.resolve({ data: null }),
        booking.destination_address_id
          ? supabase.from("addresses").select("*").eq("id", booking.destination_address_id).single()
          : Promise.resolve({ data: null }),
        supabase.from("removals_details").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("man_and_van_details").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("house_clearance_details").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("house_cleaning_details").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("end_of_tenancy_details").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("additional_services").select("*").eq("booking_id", bookingId).maybeSingle(),
        supabase.from("booking_notes").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("status_history").select("*").eq("booking_id", bookingId).order("changed_at", { ascending: false }),
        supabase.from("activity_log").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true }),
        supabase.from("invoices").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
      ]);

      setData({
        booking: booking as Booking,
        customer: customer as Customer,
        originAddress: originAddress as Address | null,
        destinationAddress: destinationAddress as Address | null,
        removalsDetails: removalsDetails as RemovalsDetails | null,
        manAndVanDetails: manAndVanDetails as ManAndVanDetails | null,
        houseClearanceDetails: houseClearanceDetails as HouseClearanceDetails | null,
        houseCleaningDetails: houseCleaningDetails as HouseCleaningDetails | null,
        endOfTenancyDetails: endOfTenancyDetails as EndOfTenancyDetails | null,
        additionalServices: additionalServices as AdditionalServices | null,
        notes: (notes ?? []) as BookingNote[],
        statusHistory: (statusHistory ?? []) as StatusHistoryEntry[],
        activityLog: (activityLog ?? []) as ActivityLogEntry[],
        invoices: (invoices ?? []) as Invoice[],
      });
    } catch {
      setError("Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refresh: fetch };
}
