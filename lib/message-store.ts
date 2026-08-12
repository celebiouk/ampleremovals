/**
 * Conversation/message persistence for the customer inbox. Our DB is the source
 * of truth (not Twilio's dashboard). One conversation per normalised phone, so
 * a customer's SMS and WhatsApp share one thread.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { normaliseUKPhone } from "@/lib/utils";

export type Channel = "sms" | "whatsapp";
export type Direction = "inbound" | "outbound";

/** Strip a Twilio `whatsapp:` prefix and normalise to E.164 (07… → +44…). */
export function normalisePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const stripped = raw.replace(/^whatsapp:/i, "").trim();
  return normaliseUKPhone(stripped);
}

/** "whatsapp:+44…" → whatsapp; otherwise sms. */
export function channelFromAddress(addr: string | null | undefined): Channel {
  return (addr ?? "").toLowerCase().startsWith("whatsapp:") ? "whatsapp" : "sms";
}

/** Common stored formats for a UK number, for matching a customer row. */
function phoneVariants(e164: string): string[] {
  const set = new Set<string>();
  if (!e164) return [];
  set.add(e164);                                   // +447700123456
  if (e164.startsWith("+44")) {
    set.add("0" + e164.slice(3));                  // 07700123456
    set.add(e164.slice(1));                        // 447700123456
    set.add(e164.slice(3));                        // 7700123456
  }
  return Array.from(set);
}

/** Find the customer whose phone matches this number, or null (→ unassigned). */
export async function matchCustomerId(supabase: any, e164: string): Promise<string | null> {
  const variants = phoneVariants(e164);
  if (!variants.length) return null;
  const { data } = await supabase.from("customers").select("id, phone").in("phone", variants).limit(1);
  return data?.[0]?.id ?? null;
}

/** Get (or create) the single conversation for a phone number. */
export async function findOrCreateConversation(
  supabase: any,
  contactPhone: string,
  customerId: string | null,
): Promise<{ id: string; unread_count: number; customer_id: string | null }> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, unread_count, customer_id")
    .eq("contact_phone", contactPhone)
    .maybeSingle();
  if (existing) {
    // Backfill the customer link if we only just matched it.
    if (!existing.customer_id && customerId) {
      await supabase.from("conversations").update({ customer_id: customerId }).eq("id", existing.id);
      existing.customer_id = customerId;
    }
    return existing;
  }
  const { data: created } = await supabase
    .from("conversations")
    .insert({ contact_phone: contactPhone, customer_id: customerId })
    .select("id, unread_count, customer_id")
    .single();
  return created;
}

export interface RecordMessageInput {
  contactPhone: string;          // the customer's number (raw or E.164) — identifies the thread
  twilioSid?: string | null;
  channel: Channel;
  direction: Direction;
  fromNumber: string;
  toNumber: string;
  body: string;
  status: string;
  mediaUrls?: string[];
  errorMessage?: string | null;
  occurredAt?: string;           // ISO; defaults now
}

/**
 * Persist a message idempotently (dedup on twilio_sid) and roll the conversation
 * forward. Inbound messages increment the unread counter. Returns the message id
 * (existing id if it was a duplicate webhook).
 */
export async function recordMessage(
  supabase: any,
  input: RecordMessageInput,
): Promise<{ messageId: string | null; conversationId: string; duplicate: boolean }> {
  const e164 = normalisePhone(input.contactPhone);
  const customerId = await matchCustomerId(supabase, e164);
  const convo = await findOrCreateConversation(supabase, e164, customerId);
  const now = input.occurredAt ?? new Date().toISOString();

  const row = {
    conversation_id: convo.id,
    customer_id: customerId,
    twilio_sid: input.twilioSid ?? null,
    channel: input.channel,
    direction: input.direction,
    from_number: input.fromNumber,
    to_number: input.toNumber,
    body: input.body ?? "",
    status: input.status,
    error_message: input.errorMessage ?? null,
    media_urls: input.mediaUrls && input.mediaUrls.length ? input.mediaUrls : null,
    sent_at: input.direction === "outbound" ? now : null,
    created_at: now,
    updated_at: now,
  };

  // Idempotent insert: on a repeated webhook (same SID) nothing is inserted.
  const { data: inserted } = await supabase
    .from("messages")
    .upsert(row, { onConflict: "twilio_sid", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();

  if (!inserted) {
    // Duplicate (or no SID collision path) — don't double-advance the conversation.
    if (input.twilioSid) {
      const { data: existing } = await supabase.from("messages").select("id").eq("twilio_sid", input.twilioSid).maybeSingle();
      return { messageId: existing?.id ?? null, conversationId: convo.id, duplicate: true };
    }
  }

  // Roll the conversation forward.
  const preview = (input.body ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const update: any = {
    last_message_at: now,
    last_message_preview: preview || (input.mediaUrls?.length ? "📎 Attachment" : ""),
    last_message_direction: input.direction,
    last_channel: input.channel,
    updated_at: new Date().toISOString(),
  };
  if (input.direction === "inbound") update.unread_count = (convo.unread_count ?? 0) + 1;
  await supabase.from("conversations").update(update).eq("id", convo.id);

  return { messageId: inserted?.id ?? null, conversationId: convo.id, duplicate: false };
}
