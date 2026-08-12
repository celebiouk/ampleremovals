import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send, ChevronUp, RefreshCw, Check, CheckCheck, AlertTriangle, Paperclip } from "lucide-react-native";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/Toast";

interface Msg {
  id: string; twilio_sid: string | null; channel: "sms" | "whatsapp"; direction: "inbound" | "outbound";
  body: string; status: string | null; error_message: string | null; media_urls: string[] | null; created_at: string;
}

function dayLabel(iso: string): string {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function ConversationScreen() {
  const router = useRouter();
  const { id, name, phone } = useLocalSearchParams<{ id: string; name?: string; phone?: string }>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const toEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/admin/conversations/${id}/messages?limit=50`);
      const json = await res.json();
      if (json.success) { setMessages(json.messages); setHasMore(json.hasMore); setNextBefore(json.nextBefore); toEnd(); }
      apiFetch(`/api/admin/conversations/${id}/read`, { method: "POST" }).catch(() => {});
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel(`m-conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (p) => {
        const m = p.new as Msg;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])); toEnd();
        apiFetch(`/api/admin/conversations/${id}/read`, { method: "POST" }).catch(() => {});
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (p) => {
        const m = p.new as Msg; setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  async function loadOlder() {
    if (!nextBefore) return;
    setLoadingOlder(true);
    try {
      const res = await apiFetch(`/api/admin/conversations/${id}/messages?limit=50&before=${encodeURIComponent(nextBefore)}`);
      const json = await res.json();
      if (json.success) { setMessages((prev) => [...json.messages, ...prev]); setHasMore(json.hasMore); setNextBefore(json.nextBefore); }
    } finally { setLoadingOlder(false); }
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/admin/conversations/${id}/reply`, { method: "POST", body: JSON.stringify({ channel, body: text.trim() }) });
      const json = await res.json();
      if (json.message) setMessages((prev) => (prev.some((x) => x.id === json.message.id) ? prev : [...prev, json.message]));
      if (!json.success) toast.error("Message failed", json.error);
      setText(""); toEnd();
    } catch (e) { toast.error("Couldn't send", e instanceof Error ? e.message : undefined); }
    finally { setSending(false); }
  }

  async function retry(mid: string) {
    try {
      const res = await apiFetch(`/api/admin/messages/${mid}/retry`, { method: "POST" });
      const json = await res.json();
      if (json.message) setMessages((prev) => [...prev.filter((x) => x.id !== mid && x.id !== json.message.id), json.message]);
      if (!json.success) toast.error("Retry failed", json.error); else toast.success("Re-sent");
    } catch { toast.error("Retry failed"); }
  }

  const groups: { day: string; items: Msg[] }[] = [];
  for (const m of messages) {
    const day = dayLabel(m.created_at); const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m); else groups.push({ day, items: [m] });
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900 dark:text-white" numberOfLines={1}>{name || "Conversation"}</Text>
          <Text className="text-xs text-slate-400">{phone}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90} className="flex-1">
        <ScrollView ref={scrollRef} className="flex-1 px-3 py-3" contentContainerStyle={{ paddingBottom: 8 }}>
          {loading ? (
            <View className="items-center py-10"><ActivityIndicator color="#7e22ce" /></View>
          ) : (
            <>
              {hasMore && (
                <Pressable onPress={loadOlder} className="mb-2 flex-row items-center justify-center gap-1.5 self-center rounded-full border border-slate-200 bg-white px-3 py-1">
                  {loadingOlder ? <ActivityIndicator size="small" color="#64748b" /> : <ChevronUp size={12} color="#64748b" />}
                  <Text className="text-xs font-medium text-slate-500">Load older</Text>
                </Pressable>
              )}
              {groups.map((g) => (
                <View key={g.day}>
                  <View className="my-3 self-center rounded-full bg-slate-200 px-3 py-0.5"><Text className="text-[11px] font-medium text-slate-500">{g.day}</Text></View>
                  {g.items.map((m) => {
                    const out = m.direction === "outbound";
                    const s = (m.status ?? "").toLowerCase();
                    const failed = ["failed", "undelivered"].includes(s);
                    return (
                      <View key={m.id} className={`mb-2.5 ${out ? "items-end" : "items-start"}`}>
                        <View className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${out ? (failed ? "border border-red-200 bg-red-50" : "bg-brand-purple-700") : "border border-slate-100 bg-white"}`}>
                          {m.body ? <Text className={`text-sm ${out && !failed ? "text-white" : failed ? "text-red-900" : "text-slate-800"}`}>{m.body}</Text> : null}
                          {m.media_urls?.length ? (
                            <View className="mt-1 flex-row items-center gap-1"><Paperclip size={11} color={out && !failed ? "#fff" : "#7e22ce"} /><Text className={`text-xs ${out && !failed ? "text-white/90" : "text-brand-purple-600"}`}>{m.media_urls.length} attachment(s)</Text></View>
                          ) : null}
                        </View>
                        <View className={`mt-0.5 flex-row items-center gap-1.5 ${out ? "flex-row-reverse" : ""}`}>
                          <Text className="text-[10px] text-slate-400">{timeLabel(m.created_at)}</Text>
                          <View className={`rounded px-1 py-0.5 ${m.channel === "whatsapp" ? "bg-green-100" : "bg-slate-200"}`}><Text className={`text-[9px] font-bold ${m.channel === "whatsapp" ? "text-green-700" : "text-slate-500"}`}>{m.channel === "whatsapp" ? "WhatsApp" : "SMS"}</Text></View>
                          {out ? (
                            failed ? <View className="flex-row items-center gap-0.5"><AlertTriangle size={10} color="#dc2626" /><Text className="text-[10px] text-red-600">Failed</Text></View>
                              : s === "read" || s === "delivered" ? <View className="flex-row items-center gap-0.5"><CheckCheck size={11} color={s === "read" ? "#16a34a" : "#94a3b8"} /><Text className="text-[10px] text-slate-400">{s === "read" ? "Read" : "Delivered"}</Text></View>
                                : <View className="flex-row items-center gap-0.5"><Check size={11} color="#94a3b8" /><Text className="text-[10px] text-slate-400">Sent</Text></View>
                          ) : <Text className="text-[10px] text-slate-400">Received</Text>}
                          {failed && <Pressable onPress={() => retry(m.id)} className="flex-row items-center gap-0.5"><RefreshCw size={9} color="#7e22ce" /><Text className="text-[10px] font-semibold text-brand-purple-600">Retry</Text></Pressable>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* Reply box */}
        <View className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-end gap-2">
            <TextInput
              value={text} onChangeText={setText} placeholder="Type a message…" multiline
              className="max-h-28 min-h-[42px] flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-base text-slate-900"
              placeholderTextColor="#94a3b8"
            />
            <Pressable onPress={send} disabled={sending || !text.trim()} className="h-[42px] flex-row items-center gap-1.5 rounded-xl bg-brand-purple-800 px-4" style={{ opacity: sending || !text.trim() ? 0.5 : 1 }}>
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}<Text className="text-sm font-bold text-white">Send</Text>
            </Pressable>
          </View>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Text className="text-xs text-slate-400">Send via</Text>
            {(["sms", "whatsapp"] as const).map((ch) => (
              <Pressable key={ch} onPress={() => setChannel(ch)} className={`rounded-full px-2.5 py-1 ${channel === ch ? (ch === "whatsapp" ? "bg-green-600" : "bg-brand-purple-700") : "bg-slate-100"}`}>
                <Text className={`text-xs font-semibold ${channel === ch ? "text-white" : "text-slate-500"}`}>{ch === "whatsapp" ? "WhatsApp" : "SMS"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
