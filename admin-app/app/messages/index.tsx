import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, MessageSquare } from "lucide-react-native";
import { Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { upperName } from "@/lib/utils";

interface ConvItem {
  id: string; contactPhone: string; customerId: string | null; customerName: string | null;
  lastMessageAt: string | null; lastMessagePreview: string | null; lastMessageDirection: string | null;
  lastChannel: string | null; unreadCount: number;
}

function listTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yst = new Date(now); yst.setDate(now.getDate() - 1);
  if (sameDay) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yst.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Messages inbox — every SMS/WhatsApp conversation. Mirrors the web inbox. */
export default function MessagesInboxScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async (query = "") => {
    try {
      const res = await apiFetch(`/api/admin/conversations?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) setItems(json.items as ConvItem[]);
    } catch { /* non-fatal */ } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(q); }, [load, q]);

  useEffect(() => {
    const ch = supabase.channel("m-inbox").on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load(q)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, q]);

  const totalUnread = items.reduce((n, c) => n + (c.unreadCount || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Messages</Text>
        {totalUnread > 0 && <View className="rounded-full bg-red-500 px-2 py-0.5"><Text className="text-xs font-bold text-white">{totalUnread} unread</Text></View>}
      </View>
      <View className="p-3">
        <View className="relative">
          <View style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}><Search size={16} color="#94a3b8" /></View>
          <Input value={q} onChangeText={setQ} placeholder="Search conversations…" className="pl-10" />
        </View>
      </View>

      {loading ? (
        <View className="items-center py-10"><ActivityIndicator color="#7e22ce" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(q); }} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <MessageSquare size={32} color="#cbd5e1" />
              <Text className="mt-2 text-sm text-slate-400">No conversations yet</Text>
            </View>
          }
          renderItem={({ item: c }) => {
            const name = c.customerName ? upperName(c.customerName) : "Unknown contact";
            const preview = `${c.lastMessageDirection === "outbound" ? "You: " : ""}${c.lastMessagePreview ?? ""}`;
            return (
              <Pressable
                onPress={() => router.push({ pathname: "/messages/[id]", params: { id: c.id, name, phone: c.contactPhone, customerId: c.customerId ?? "" } } as never)}
                className="flex-row items-start gap-3 border-b border-slate-50 px-4 py-3 dark:border-slate-800"
              >
                <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-brand-purple-100">
                  <Text className="text-sm font-bold text-brand-purple-700">{(c.customerName ?? "?")[0]?.toUpperCase()}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className={`flex-1 text-sm ${c.unreadCount ? "font-bold text-slate-900" : "font-semibold text-slate-800"} dark:text-white`} numberOfLines={1}>{name}</Text>
                    <Text className="text-[11px] text-slate-400">{listTime(c.lastMessageAt)}</Text>
                  </View>
                  <Text className="text-xs text-slate-500" numberOfLines={1}>{c.contactPhone}</Text>
                  <View className="mt-0.5 flex-row items-center justify-between gap-2">
                    <Text className={`flex-1 text-xs ${c.unreadCount ? "font-medium text-slate-700" : "text-slate-400"}`} numberOfLines={1}>{preview}</Text>
                    <View className="flex-row items-center gap-1.5">
                      {c.lastChannel ? <View className={`rounded px-1 py-0.5 ${c.lastChannel === "whatsapp" ? "bg-green-100" : "bg-slate-200"}`}><Text className={`text-[9px] font-bold ${c.lastChannel === "whatsapp" ? "text-green-700" : "text-slate-500"}`}>{c.lastChannel === "whatsapp" ? "WA" : "SMS"}</Text></View> : null}
                      {c.unreadCount > 0 && <View className="rounded-full bg-red-500 px-1.5 py-0.5"><Text className="text-[10px] font-bold text-white">{c.unreadCount}</Text></View>}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
