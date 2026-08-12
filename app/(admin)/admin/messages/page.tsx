"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upperName } from "@/lib/utils";
import { ConversationView } from "@/components/admin/messages/ConversationView";

interface ConvItem {
  id: string;
  contactPhone: string;
  customerId: string | null;
  customerName: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageDirection: string | null;
  lastChannel: string | null;
  unreadCount: number;
}

function listTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM");
}

export default function MessagesInboxPage() {
  const [items, setItems] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConvItem | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/conversations?q=${encodeURIComponent(searchRef.current)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setItems(json.items as ConvItem[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, search]);

  // Live: any change to conversations/messages refreshes the list previews + unread.
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("inbox-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  function open(c: ConvItem) {
    setSelected(c);
    // Optimistically clear its unread in the list.
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));
  }

  const totalUnread = items.reduce((n, c) => n + (c.unreadCount || 0), 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation list */}
      <div className={`flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:w-80 md:shrink-0 ${selected ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Messages</h2>
            {totalUnread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{totalUnread} unread</span>}
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…"
              className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-purple-300" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <MessageSquare className="mb-2 h-8 w-8 text-slate-200" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            items.map((c) => {
              const active = selected?.id === c.id;
              const name = c.customerName ? upperName(c.customerName) : "Unknown contact";
              const preview = `${c.lastMessageDirection === "outbound" ? "You: " : ""}${c.lastMessagePreview ?? ""}`;
              return (
                <button key={c.id} onClick={() => open(c)}
                  className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${active ? "bg-brand-purple-50" : ""}`}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple-100 text-sm font-bold text-brand-purple-700">
                    {(c.customerName ?? "?")[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{name}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{listTime(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{c.contactPhone}</p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${c.unreadCount ? "font-medium text-slate-700" : "text-slate-400"}`}>{preview}</p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {c.lastChannel && (
                          <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${c.lastChannel === "whatsapp" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                            {c.lastChannel === "whatsapp" ? "WA" : "SMS"}
                          </span>
                        )}
                        {c.unreadCount > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={`flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${selected ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
        {selected && (
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{selected.customerName ? upperName(selected.customerName) : "Unknown contact"}</p>
              <p className="text-xs text-slate-400">{selected.contactPhone}{selected.customerId ? "" : " · unassigned"}</p>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 md:hidden">Back</button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <ConversationView conversationId={selected?.id ?? null} contactPhone={selected?.contactPhone} />
        </div>
      </div>
    </div>
  );
}
