/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, ClipboardList, User } from "lucide-react-native";
import { Input, StatusBadge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { BookingStatus, ServiceType } from "@/types";

interface BookingHit {
  id: string;
  reference: string;
  status: BookingStatus;
  service_type: ServiceType;
  customer_name: string;
}
interface CustomerHit {
  id: string;
  full_name: string;
  email: string;
}

export function GlobalSearch({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingHit[]>([]);
  const [customers, setCustomers] = useState<CustomerHit[]>([]);

  useEffect(() => {
    if (!visible) { setQ(""); setBookings([]); setCustomers([]); }
  }, [visible]);

  // Debounced search across bookings + customers.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setBookings([]); setCustomers([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [b, c] = await Promise.all([
          supabase
            .from("bookings")
            .select("id, reference, status, service_type, customers!inner(full_name)")
            .ilike("reference", `%${term}%`)
            .limit(15),
          supabase
            .from("customers")
            .select("id, full_name, email")
            .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
            .limit(15),
        ]);
        setBookings(
          (b.data ?? []).map((x: any) => ({
            id: x.id, reference: x.reference, status: x.status, service_type: x.service_type,
            customer_name: x.customers?.full_name ?? "—",
          }))
        );
        setCustomers((c.data ?? []) as CustomerHit[]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  function go(path: string) {
    onClose();
    router.push(path as never);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <View className="relative flex-1">
            <View className="absolute left-3 top-3.5 z-10"><Search size={18} color="#94a3b8" /></View>
            <Input value={q} onChangeText={setQ} placeholder="Search bookings & customers" autoFocus autoCapitalize="none" className="pl-10" />
          </View>
          <Pressable onPress={onClose} className="p-1"><X size={24} color="#94a3b8" /></Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 gap-5" keyboardShouldPersistTaps="handled">
          {loading ? (
            <View className="items-center py-8"><ActivityIndicator color="#7e22ce" /></View>
          ) : q.trim().length < 2 ? (
            <Text className="px-1 pt-4 text-center text-sm text-slate-400">Type at least 2 characters to search.</Text>
          ) : (
            <>
              {bookings.length > 0 && (
                <View>
                  <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Bookings</Text>
                  <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {bookings.map((b, i) => (
                      <Pressable
                        key={b.id}
                        onPress={() => go(`/booking/${b.id}`)}
                        className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}
                      >
                        <ClipboardList size={18} color="#7e22ce" />
                        <View className="flex-1">
                          <Text className="font-medium text-slate-900 dark:text-white">{b.customer_name}</Text>
                          <Text className="font-mono text-xs text-slate-400">{b.reference}</Text>
                        </View>
                        <StatusBadge status={b.status} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {customers.length > 0 && (
                <View>
                  <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Customers</Text>
                  <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {customers.map((c, i) => (
                      <Pressable
                        key={c.id}
                        onPress={() => go(`/customer/${c.id}`)}
                        className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}
                      >
                        <User size={18} color="#7e22ce" />
                        <View className="flex-1">
                          <Text className="font-medium text-slate-900 dark:text-white">{c.full_name}</Text>
                          {c.email ? <Text className="text-xs text-slate-400">{c.email}</Text> : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {bookings.length === 0 && customers.length === 0 && (
                <Text className="px-1 pt-4 text-center text-sm text-slate-400">No results for &ldquo;{q}&rdquo;.</Text>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
