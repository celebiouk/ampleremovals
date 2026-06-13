/**
 * GET/POST /api/worker/preferences — get/update worker notification preferences
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get worker preferences (or return defaults)
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, notifications_email, notifications_sms")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, notifications_email, notifications_sms")
      .eq("user_id", userId)
      .single();

    const worker = driver || cleaner;

    if (!worker) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: {
        email: worker.notifications_email ?? true,
        sms: worker.notifications_sms ?? false,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Update preferences
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id")
      .eq("user_id", userId)
      .single();

    const isDriver = !!driver;
    const tableName = isDriver ? "drivers" : "cleaners";
    const workerId = driver?.id || cleaner?.id;

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from(tableName)
      .update({
        notifications_email: body.email ?? true,
        notifications_sms: body.sms ?? false,
      })
      .eq("id", workerId);

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      preferences: {
        email: body.email ?? true,
        sms: body.sms ?? false,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
