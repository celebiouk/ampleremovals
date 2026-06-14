/**
 * POST /api/drivers/upload — bearer-authenticated file upload for the mobile
 * driver app (pickup/delivery photos + signatures, profile photo). Uploads via
 * the service role into the driver-documents bucket and returns a signed URL +
 * storage path. Body: multipart/form-data { file, path }.
 *
 * `path` is a caller-supplied relative key, e.g. "jobs/<id>/pickup/photos/167…".
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "driver-documents";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const rawPath = (form.get("path") as string | null)?.replace(/^\/+/, "") ?? "";

    if (!file) return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ success: false, error: "Images only" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, error: "File must be under 10MB" }, { status: 400 });
    if (!rawPath || rawPath.includes("..")) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });

    const supabase = createAdminClient();
    const ext = file.type.split("/")[1]?.split("+")[0] || "jpg";
    const key = rawPath.includes(".") ? rawPath : `${rawPath}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET).upload(key, bytes, { contentType: file.type, upsert: true });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24 * 30);
    return NextResponse.json({ success: true, path: key, signedUrl: signed?.signedUrl ?? null });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
