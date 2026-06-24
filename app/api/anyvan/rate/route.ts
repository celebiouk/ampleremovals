/**
 * POST /api/anyvan/rate — public. Records a customer's star rating (1–5) + optional
 * feedback against an AnyVan job. The page funnels 5★ to a Google review.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { id?: string; rating?: number; feedback?: string } | null;
    const id = body?.id;
    const rating = Number(body?.rating);
    if (!id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Invalid rating" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("anyvan_jobs")
      .update({ rating, rating_feedback: body?.feedback?.trim() || null, rated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Could not save rating" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
