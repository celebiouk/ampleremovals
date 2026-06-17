/**
 * GET /api/admin/insights — deterministic business insights (no AI).
 *
 * Conversion + value stats sliced by lead source, day of week and job size,
 * computed from your own bookings. "Won" = reached a paid/confirmed/completed
 * stage; "lost" = bad_lead / not_a_good_fit.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ukDateString } from "@/lib/dates";

const WON = new Set(["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid", "job_completed"]);
const LOST = new Set(["bad_lead", "not_a_good_fit"]);
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Bucket = { total: number; won: number; lost: number; value: number };
const blank = (): Bucket => ({ total: 0, won: 0, lost: 0, value: 0 });

function rate(b: Bucket): number {
  const decided = b.won + b.lost;
  return decided > 0 ? Math.round((b.won / decided) * 100) : 0;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();

  // Last 180 days of bookings.
  const since = new Date(Date.now() - 180 * 86400000).toISOString();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("status, source, created_at, move_date, quote_total, lead_score, service_type")
    .gte("created_at", since)
    .limit(5000);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const bySource: Record<string, Bucket> = {};
  const byDay: Record<string, Bucket> = {};
  const byService: Record<string, Bucket> = {};
  const overall = blank();
  let scoreSum = 0, scoreCount = 0;

  for (const b of bookings ?? []) {
    const won = WON.has(b.status);
    const lost = LOST.has(b.status);
    const value = won ? Number(b.quote_total ?? 0) : 0;

    const bump = (m: Record<string, Bucket>, key: string) => {
      const k = key || "unknown";
      (m[k] ??= blank());
      m[k].total++; if (won) m[k].won++; if (lost) m[k].lost++; m[k].value += value;
    };

    bump(bySource, (b.source ?? "unknown").replace(/_/g, " "));
    const day = b.created_at ? DOW[new Date(ukDateString(b.created_at) + "T12:00:00Z").getUTCDay()] : "unknown";
    bump(byDay, day);
    bump(byService, (b.service_type ?? "unknown").replace(/_/g, " "));

    overall.total++; if (won) overall.won++; if (lost) overall.lost++; overall.value += value;
    if (b.lead_score != null) { scoreSum += b.lead_score; scoreCount++; }
  }

  const toRows = (m: Record<string, Bucket>) =>
    Object.entries(m)
      .map(([key, b]) => ({ key, total: b.total, won: b.won, lost: b.lost, conversion: rate(b), value: Math.round(b.value) }))
      .sort((a, b) => b.total - a.total);

  // Surface a couple of headline insights deterministically.
  const sourceRows = toRows(bySource).filter((r) => r.won + r.lost >= 3);
  const dayRows = toRows(byDay).filter((r) => r.won + r.lost >= 3);
  const bestSource = [...sourceRows].sort((a, b) => b.conversion - a.conversion)[0];
  const worstDay = [...dayRows].sort((a, b) => a.conversion - b.conversion)[0];
  const headlines: string[] = [];
  if (bestSource) headlines.push(`${bestSource.key} converts best at ${bestSource.conversion}% (${bestSource.won}/${bestSource.won + bestSource.lost}).`);
  if (worstDay) headlines.push(`${worstDay.key} enquiries convert lowest at ${worstDay.conversion}%.`);

  return NextResponse.json({
    success: true,
    overall: { ...overall, conversion: rate(overall), value: Math.round(overall.value), avgLeadScore: scoreCount ? Math.round(scoreSum / scoreCount) : null },
    bySource: toRows(bySource),
    byDay: toRows(byDay),
    byService: toRows(byService),
    headlines,
  });
}
