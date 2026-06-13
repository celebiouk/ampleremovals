/**
 * POST /api/admin/worker-bank-details — save/update worker bank details (encrypted)
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const BankDetailsSchema = z.object({
  worker_type: z.enum(["driver", "cleaner"]),
  worker_id: z.string().uuid(),
  sort_code: z.string().regex(/^\d{2}-\d{2}-\d{2}$/),
  account_number: z.string().regex(/^\d{8}$/),
  account_holder_name: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = BankDetailsSchema.parse(body);

    const supabase = createAdminClient();

    // Upsert bank details (insert or update)
    const { error } = await supabase.from("worker_bank_details").upsert(
      {
        worker_type: input.worker_type,
        worker_id: input.worker_id,
        sort_code: input.sort_code,
        account_number: input.account_number,
        account_holder_name: input.account_holder_name,
      },
      { onConflict: "worker_type,worker_id" }
    );

    if (error) {
      throw new Error(`Failed to save bank details: ${error.message}`);
    }

    // Log action
    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "Bank details saved",
      metadata: {
        worker_type: input.worker_type,
        worker_id: input.worker_id,
      },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", issues: e.issues },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
