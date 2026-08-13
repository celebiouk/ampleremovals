"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, Send, Search, MessageSquare, AlertTriangle, RefreshCw, Check, CheckCheck, ChevronUp, Paperclip, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  twilio_sid: string | null;
  channel: "sms" | "whatsapp" | "email";
  direction: "inbound" | "outbound";
  body: string;
  subject?: string | null;      // email subject line (email channel only)
  status: string | null;
  error_message: string | null;
  media_urls: string[] | null;
  created_at: string;
}

/** Shape returned by the web-only /emails endpoint. */
interface EmailRow {
  id: string; to_email: string; from_email: string | null; subject: string | null;
  preview: string | null; status: string | null; error_message: string | null; created_at: string;
}

/** Map a logged email into the unified chat-message shape (always outbound). */
function emailToMessage(e: EmailRow): ChatMessage {
  return {
    id: `email-${e.id}`, twilio_sid: null, channel: "email", direction: "outbound",
    body: e.preview ?? "", subject: e.subject, status: e.status, error_message: e.error_message,
    media_urls: null, created_at: e.created_at,
  };
}

/** Merge/sort a message set chronologically (oldest → newest), de-duped by id. */
function sortByCreated(list: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return list
    .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMM yyyy");
}
const timeLabel = (iso: string) => format(new Date(iso), "h:mm a");

/** Outbound delivery status → label + icon. */
function statusView(m: ChatMessage) {
  const s = (m.status ?? "").toLowerCase();
  if (["failed", "undelivered"].includes(s)) return { label: "Failed", tone: "text-red-600", icon: <AlertTriangle className="h-3 w-3" /> };
  if (s === "read") return { label: "Read", tone: "text-brand-green-600", icon: <CheckCheck className="h-3 w-3" /> };
  if (s === "delivered") return { label: "Delivered", tone: "text-slate-400", icon: <CheckCheck className="h-3 w-3" /> };
  if (["sent", "queued", "sending", "accepted"].includes(s)) return { label: "Sent", tone: "text-slate-400", icon: <Check className="h-3 w-3" /> };
  return { label: s || "Sent", tone: "text-slate-400", icon: <Check className="h-3 w-3" /> };
}

const ChannelTag = ({ channel }: { channel: "sms" | "whatsapp" | "email" }) => {
  const map = {
    whatsapp: { label: "WhatsApp", cls: "bg-green-100 text-green-700" },
    email: { label: "Email", cls: "bg-blue-100 text-blue-700" },
    sms: { label: "SMS", cls: "bg-slate-200 text-slate-600" },
  } as const;
  const t = map[channel];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.cls}`}>{t.label}</span>;
};

export function ConversationView({
  conversationId,
  contactPhone,
  customerId,
}: {
  conversationId: string | null;
  contactPhone?: string | null;
  customerId?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }));
  }, []);

  // Load first page + mark read whenever the conversation changes.
  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // Messages (SMS/WhatsApp) + any emails we've sent this customer, merged.
        // Skip the email fetch for unassigned (no-customer) conversations.
        const [msgRes, emailRes] = await Promise.all([
          fetch(`/api/admin/conversations/${conversationId}/messages?limit=50`, { cache: "no-store" }),
          customerId
            ? fetch(`/api/admin/conversations/${conversationId}/emails`, { cache: "no-store" }).catch(() => null)
            : Promise.resolve(null),
        ]);
        const json = await msgRes.json();
        if (cancelled || !json.success) return;
        const emailJson = emailRes ? await emailRes.json().catch(() => null) : null;
        const emails = emailJson?.success ? (emailJson.emails as EmailRow[]).map(emailToMessage) : [];
        setMessages(sortByCreated([...(json.messages as ChatMessage[]), ...emails]));
        setHasMore(json.hasMore); setNextBefore(json.nextBefore);
        scrollToBottom();
        // Mark read — only because the admin actually opened it.
        fetch(`/api/admin/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [conversationId, customerId, scrollToBottom]);

  // Realtime: new/updated messages in this conversation, no refresh needed.
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const channelSub = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : sortByCreated([...prev, m])));
        scrollToBottom(true);
        // Keep it read while the thread is open.
        fetch(`/api/admin/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      // Emails sent to this customer land live too (web-only table).
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_emails", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const em = emailToMessage(payload.new as EmailRow);
        setMessages((prev) => (prev.some((x) => x.id === em.id) ? prev : sortByCreated([...prev, em])));
        scrollToBottom(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channelSub); };
  }, [conversationId, scrollToBottom]);

  async function loadOlder() {
    if (!conversationId || !nextBefore) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/messages?limit=50&before=${encodeURIComponent(nextBefore)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => sortByCreated([...(json.messages as ChatMessage[]), ...prev]));
        setHasMore(json.hasMore); setNextBefore(json.nextBefore);
        requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
      }
    } finally { setLoadingOlder(false); }
  }

  async function send() {
    if (!conversationId || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/reply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, body: text.trim() }),
      });
      const json = await res.json();
      if (json.message) setMessages((prev) => (prev.some((x) => x.id === json.message.id) ? prev : [...prev, json.message]));
      if (!json.success) toast.error(json.error || "Message failed to send");
      setText("");
      scrollToBottom(true);
    } catch {
      toast.error("Couldn't send the message");
    } finally { setSending(false); }
  }

  async function retry(id: string) {
    try {
      const res = await fetch(`/api/admin/messages/${id}/retry`, { method: "POST" });
      const json = await res.json();
      if (json.message) {
        setMessages((prev) => [...prev.filter((x) => x.id !== id && x.id !== json.message.id), json.message]);
      }
      if (!json.success) toast.error(json.error || "Retry failed");
      else toast.success("Message re-sent");
      scrollToBottom(true);
    } catch { toast.error("Retry failed"); }
  }

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
        <MessageSquare className="mb-2 h-10 w-10 text-slate-200" />
        <p className="text-sm">Select a conversation</p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = q
    ? messages.filter((m) => `${m.subject ?? ""} ${m.body ?? ""}`.toLowerCase().includes(q))
    : messages;

  // Group by day for separators.
  const groups: { day: string; items: ChatMessage[] }[] = [];
  for (const m of shown) {
    const day = dayLabel(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search within conversation */}
      <div className="border-b border-slate-100 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this conversation…"
            className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-brand-purple-300" />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-3 py-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <MessageSquare className="mb-2 h-8 w-8 text-slate-200" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <>
            {hasMore && !q && (
              <div className="mb-2 flex justify-center">
                <button onClick={loadOlder} disabled={loadingOlder} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50">
                  {loadingOlder ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronUp className="h-3 w-3" />} Load older messages
                </button>
              </div>
            )}
            {groups.map((g) => (
              <div key={g.day}>
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-slate-200/70 px-3 py-0.5 text-[11px] font-medium text-slate-500">{g.day}</span>
                </div>
                {g.items.map((m) => {
                  const out = m.direction === "outbound";
                  const isEmail = m.channel === "email";
                  const st = out ? statusView(m) : null;
                  const failed = st?.label === "Failed";
                  return (
                    <div key={m.id} className={`mb-2.5 flex ${out ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] ${out ? "items-end" : "items-start"} flex flex-col`}>
                        {isEmail ? (
                          // Email: a light card with the subject headline + preview.
                          <div className={`rounded-2xl border px-3.5 py-2 text-sm shadow-sm ${failed ? "border-red-200 bg-red-50 text-red-900" : "border-blue-200 bg-blue-50 text-slate-800"}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                              <Mail className="h-3 w-3" /> Email
                            </div>
                            {m.subject ? <p className="font-semibold text-slate-900 break-words">{m.subject}</p> : null}
                            {m.body ? <p className="mt-0.5 whitespace-pre-wrap break-words text-slate-600">{m.body}</p> : null}
                          </div>
                        ) : (
                          <div className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${out ? (failed ? "bg-red-50 text-red-900 border border-red-200" : "bg-brand-purple-700 text-white") : "bg-white text-slate-800 border border-slate-100"}`}>
                            {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
                            {m.media_urls?.length ? (
                              <div className="mt-1 space-y-1">
                                {m.media_urls.map((u, i) => (
                                  <a key={i} href={u} target="_blank" rel="noreferrer" className={`flex items-center gap-1 text-xs underline ${out ? "text-white/90" : "text-brand-purple-600"}`}>
                                    <Paperclip className="h-3 w-3" /> Attachment {i + 1}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                        <div className={`mt-0.5 flex items-center gap-1.5 px-1 ${out ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] text-slate-400">{timeLabel(m.created_at)}</span>
                          <ChannelTag channel={m.channel} />
                          {out ? (
                            <span className={`flex items-center gap-0.5 text-[10px] ${st!.tone}`}>{st!.icon}{st!.label}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Received</span>
                          )}
                          {failed && !isEmail && (
                            <button onClick={() => retry(m.id)} className="flex items-center gap-0.5 text-[10px] font-semibold text-brand-purple-600 hover:underline">
                              <RefreshCw className="h-2.5 w-2.5" /> Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Reply box */}
      <div className="border-t border-slate-100 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={contactPhone ? `Message ${contactPhone}…` : "Type a message…"}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-purple-400"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="flex h-[42px] items-center gap-1.5 rounded-xl bg-brand-purple-800 px-4 text-sm font-bold text-white hover:bg-brand-purple-900 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Send via</span>
          {(["sms", "whatsapp"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${channel === c ? (c === "whatsapp" ? "bg-green-600 text-white" : "bg-brand-purple-700 text-white") : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {c === "whatsapp" ? "WhatsApp" : "SMS"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
