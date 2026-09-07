/**
 * URL shortener for SMS links only (SMS is billed per 153-char segment, so a
 * long quote/complete link can push a text into extra segments — this collapses
 * it to `${SITE}/s/<6 chars>`). Email and WhatsApp keep the full link — no per-
 * character cost there, and a Twilio-branded destination reads worse in an email.
 *
 * Old, already-sent full links keep working forever (their routes are untouched);
 * this only changes what NEW SMS messages contain.
 */
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const CODE_LEN = 6;
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/l/I

function randomCode(): string {
  const bytes = randomBytes(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * Returns a short link (`${SITE}/s/<code>`) for `targetUrl`. Reuses an existing
 * code for the same target if one was already created (idempotent). Best-effort:
 * on any failure it returns the original `targetUrl` unshortened so a link is
 * never lost from the message.
 */
export async function shortenUrl(targetUrl: string): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("short_links")
      .select("code")
      .eq("target_url", targetUrl)
      .maybeSingle();
    if (existing?.code) return codeToUrl(existing.code);

    for (let i = 0; i < 8; i++) {
      const code = randomCode();
      const { error } = await supabase.from("short_links").insert({ code, target_url: targetUrl });
      if (!error) return codeToUrl(code);
      // Collision on the code PK — try again with a fresh one.
    }
    return targetUrl;
  } catch {
    return targetUrl;
  }
}

function codeToUrl(code: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
  return `${site}/s/${code}`;
}
