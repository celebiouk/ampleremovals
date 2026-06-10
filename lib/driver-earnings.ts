/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Calculates driver earnings for a booking once its FULL invoice is paid —
 * regardless of how it was paid (Stripe webhook or a manual "mark as paid").
 *
 * VAT is excluded from the driver's base. A driver's percentage is of the
 * NET job value (the work), not the VAT collected for HMRC:
 *   net     = invoiceTotal − vatAmount       (vatAmount 0 ⇒ net = total)
 *   gross   = net × (pay% / 100)             (override or driver default)
 *   tips    = sum of recorded tips for the driver on this booking
 *   total   = gross + tips
 *
 * Example: £120 invoice = £100 net + £20 VAT. A 40% driver earns 40% of
 * £100 = £40, not 40% of £120.
 *
 * A £0 `driver_earnings` placeholder is created when a driver is assigned, so
 * this UPDATEs that row in place. It only skips a row that has already been
 * calculated (booking_total > 0) — the true idempotency guard, so repeated
 * webhook deliveries or a manual re-mark don't double-count.
 *
 * Driver PAYMENT remains entirely manual (admin marks earnings as paid after a
 * bank transfer). This only computes what is owed; it never moves money.
 *
 * Best-effort: never throws — earnings must not block invoice processing.
 *
 * @param bookingId    the booking the invoice belongs to
 * @param invoiceTotal the gross invoice total (VAT-inclusive)
 * @param vatAmount    the VAT portion of that total (0 if none was charged)
 */
export async function calculateDriverEarnings(
  bookingId: string,
  invoiceTotal: number,
  vatAmount: number = 0
): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Driver % is applied to the net (ex-VAT) job value.
    const netAmount = Math.max(0, invoiceTotal - (vatAmount || 0));

    const { data: assignments } = await supabase
      .from("booking_driver_assignments")
      .select("id, driver_id, pay_percentage_override, drivers(default_pay_percentage)")
      .eq("booking_id", bookingId);

    if (!assignments || assignments.length === 0) return;

    for (const assignment of assignments) {
      // A placeholder may already exist from when the driver was assigned.
      const { data: existing } = await supabase
        .from("driver_earnings")
        .select("id, booking_total, tip_amount")
        .eq("assignment_id", assignment.id)
        .maybeSingle();

      if (existing && Number(existing.booking_total) > 0) {
        continue; // Already calculated
      }

      const payPercentage =
        assignment.pay_percentage_override ||
        (assignment.drivers as any)?.default_pay_percentage ||
        0;
      const grossEarnings = (netAmount * payPercentage) / 100;

      // Prefer tips already accumulated on the placeholder; else sum them.
      let tipAmount = existing ? Number(existing.tip_amount) || 0 : 0;
      if (!existing) {
        const { data: tips } = await supabase
          .from("driver_tips")
          .select("amount")
          .eq("driver_id", assignment.driver_id)
          .eq("booking_id", bookingId);
        tipAmount = tips?.reduce((sum, tip) => sum + tip.amount, 0) || 0;
      }

      const totalEarnings = grossEarnings + tipAmount;

      if (existing) {
        await supabase
          .from("driver_earnings")
          .update({
            // booking_total stores the NET base the % was applied to
            booking_total: netAmount,
            pay_percentage: payPercentage,
            gross_earnings: grossEarnings,
            tip_amount: tipAmount,
            total_earnings: totalEarnings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("driver_earnings").insert({
          driver_id: assignment.driver_id,
          booking_id: bookingId,
          assignment_id: assignment.id,
          booking_total: netAmount, // net (ex-VAT) base
          pay_percentage: payPercentage,
          gross_earnings: grossEarnings,
          tip_amount: tipAmount,
          total_earnings: totalEarnings,
          status: "pending", // Awaiting admin approval, then manual payment
        });
      }

      const vatNote = vatAmount > 0 ? ` — net of £${vatAmount.toFixed(2)} VAT` : "";
      await supabase.from("activity_log").insert({
        booking_id: bookingId,
        action: `Driver earnings calculated: £${totalEarnings.toFixed(2)} (${payPercentage}% of £${netAmount.toFixed(2)}${vatNote})`,
        metadata: {
          driver_id: assignment.driver_id,
          earnings: totalEarnings,
          net_base: netAmount,
          vat_excluded: vatAmount || 0,
        },
        performed_by: "system",
      });
    }
  } catch (error) {
    console.error("calculateDriverEarnings error:", error);
    // Best-effort — never block invoice processing.
  }
}
