import { createAdminClient } from "@/lib/supabase/server";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a push notification to every registered admin device via Expo's push
 * service. Best-effort: never throws (so it can't break the action that
 * triggered it) and prunes tokens Expo reports as invalid.
 *
 * Real delivery requires the mobile app to have an EAS projectId (`eas init`)
 * and APNs/FCM credentials configured — see admin-app/README.md.
 */
export async function sendAdminPush({ title, body, data }: PushPayload): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: rows } = await supabase.from("admin_push_tokens").select("expo_token");
    const tokens = (rows ?? []).map((r) => r.expo_token).filter(Boolean);
    if (tokens.length === 0) return;

    const messages = tokens.map((to) => ({ to, title, body, data, sound: "default", priority: "high" }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) return;

    const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
    const receipts = json.data ?? [];

    // Prune tokens Expo says are no longer registered.
    const dead: string[] = [];
    receipts.forEach((r, i) => {
      if (r.status === "error" && r.details?.error === "DeviceNotRegistered") dead.push(tokens[i]);
    });
    if (dead.length > 0) {
      await supabase.from("admin_push_tokens").delete().in("expo_token", dead);
    }
  } catch {
    // Swallow — push must never break the originating request.
  }
}
