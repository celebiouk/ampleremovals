/**
 * POST /api/admin/earnings/pay — pay one or many driver_earnings rows in a
 * single action (see lib/payroll/payEarnings.ts for the actual logic).
 * Replaces the old single-earning /pay endpoint so every payment — single
 * or bulk — gets the same driver_payments record-keeping and email.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { payEarningsBatch } from "@/lib/payroll/payEarnings";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { earningIds?: string[] } | null;
  const earningIds = Array.isArray(body?.earningIds) ? body!.earningIds.filter(Boolean) : [];

  const supabase = createAdminClient();
  const result = await payEarningsBatch(supabase, earningIds);
  if (!result.success) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
