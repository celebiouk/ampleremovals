/**
 * Pay one or many driver_earnings rows in a single action. Works identically
 * whether admin picks one job or twenty across several weeks (the "pay
 * weekly" workflow is just this, run on a schedule — no separate feature).
 * A mixed-worker selection fans out into one driver_payments record + one
 * email PER worker, each only listing their own jobs.
 */
import type { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { generatePaymentReference, formatCurrency, formatDate } from "@/lib/utils";
import { logError } from "@/lib/log-error";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface EarningRow {
  id: string;
  driver_id: string;
  booking_id: string | null;
  total_earnings: number;
  status: string;
  booking: { reference: string; move_date: string | null } | { reference: string; move_date: string | null }[] | null;
  driver: { first_name: string; preferred_name: string | null; email: string | null } | { first_name: string; preferred_name: string | null; email: string | null }[] | null;
}

export interface PayEarningsResult {
  success: boolean;
  error?: string;
  payments?: { driverId: string; reference: string; amount: number }[];
}

export async function payEarningsBatch(supabase: SupabaseAdmin, earningIds: string[]): Promise<PayEarningsResult> {
  if (earningIds.length === 0) return { success: false, error: "Select at least one job to pay" };

  const { data, error } = await supabase
    .from("driver_earnings")
    .select(`
      id, driver_id, booking_id, total_earnings, status,
      booking:bookings(reference, move_date),
      driver:drivers(first_name, preferred_name, email)
    `)
    .in("id", earningIds);
  if (error) return { success: false, error: error.message };

  const rows = (data ?? []) as unknown as EarningRow[];
  if (rows.length !== earningIds.length) {
    return { success: false, error: "One or more jobs couldn't be found" };
  }
  const notReady = rows.filter((r) => r.status !== "approved");
  if (notReady.length > 0) {
    return { success: false, error: `${notReady.length} of the selected jobs aren't approved yet — confirm or approve them first` };
  }

  // Group by driver — one payment record + one email each, even if admin
  // selected jobs across several workers in one go.
  const byDriver = new Map<string, EarningRow[]>();
  for (const r of rows) {
    if (!byDriver.has(r.driver_id)) byDriver.set(r.driver_id, []);
    byDriver.get(r.driver_id)!.push(r);
  }

  const payments: { driverId: string; reference: string; amount: number }[] = [];

  for (const [driverId, driverRows] of Array.from(byDriver.entries())) {
    const amount = driverRows.reduce((sum, r) => sum + Number(r.total_earnings || 0), 0);
    const reference = generatePaymentReference();
    const now = new Date().toISOString();

    const { data: payment, error: payErr } = await supabase
      .from("driver_payments")
      .insert({ driver_id: driverId, reference, amount, paid_at: now })
      .select("id")
      .single();
    if (payErr || !payment) {
      await logError({ message: `driver_payments insert failed: ${payErr?.message}`, metadata: { driverId } });
      continue;
    }

    await supabase.from("driver_payment_earnings").insert(
      driverRows.map((r) => ({ payment_id: payment.id, earning_id: r.id }))
    );
    await supabase.from("driver_earnings").update({ status: "paid", paid_at: now }).in("id", driverRows.map((r) => r.id));

    await Promise.allSettled(
      driverRows.map((r) => {
        const b = Array.isArray(r.booking) ? r.booking[0] : r.booking;
        return supabase.from("activity_log").insert({
          booking_id: r.booking_id ?? null,
          action: `Paid ${formatCurrency(Number(r.total_earnings))} to driver — ${reference}${b?.reference ? ` (${b.reference})` : ""}`,
          metadata: { earning_id: r.id, driver_id: driverId, payment_id: payment.id },
          performed_by: "admin",
        });
      })
    );

    payments.push({ driverId, reference, amount });

    const driverInfo = Array.isArray(driverRows[0].driver) ? driverRows[0].driver[0] : driverRows[0].driver;
    if (driverInfo?.email) {
      const firstName = driverInfo.preferred_name || driverInfo.first_name || "there";
      const jobLines = driverRows.map((r) => {
        const b = Array.isArray(r.booking) ? r.booking[0] : r.booking;
        const date = b?.move_date ? formatDate(b.move_date) : "—";
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">${b?.reference ?? "—"} · ${date}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;text-align:right;">${formatCurrency(Number(r.total_earnings))}</td>
        </tr>`;
      }).join("");

      const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:0;">
        <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">You've been paid</h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
          <p style="color:#0f172a;margin:0 0 14px;">Hi ${firstName},</p>
          <p style="color:#475569;line-height:1.6;margin:0 0 20px;">We've just sent payment for ${driverRows.length === 1 ? "the job below" : `the ${driverRows.length} jobs below`} — reference <strong>${reference}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead><tr><th style="text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:6px;">Job</th><th style="text-align:right;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:6px;">Amount</th></tr></thead>
            <tbody>${jobLines}</tbody>
          </table>
          <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 16px;border-radius:8px;margin-bottom:20px;">
            <p style="margin:0;font-size:22px;font-weight:bold;color:#16a34a;">${formatCurrency(amount)} total</p>
          </div>
          <p style="color:#475569;line-height:1.6;margin:0 0 14px;">Please check your bank over the next day or two to confirm it's landed.</p>
          <p style="color:#475569;line-height:1.6;margin:0;"><strong>If anything looks wrong, let us know within 48 hours.</strong> After that we'll treat this payment as settled.</p>
        </div>
      </body></html>`;

      try {
        await sendEmail({ to: driverInfo.email, subject: `Payment sent: ${formatCurrency(amount)}`, html });
      } catch (e) {
        await logError({ message: `Payment email failed: ${e instanceof Error ? e.message : String(e)}`, metadata: { driverId, reference } });
      }
    }
  }

  return { success: true, payments };
}
