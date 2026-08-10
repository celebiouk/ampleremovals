/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw, Clock, MapPin, Coffee, Route as RouteIcon } from "lucide-react-native";
import { Card } from "@/components/ui";
import { DateField } from "@/components/DateField";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { toDateKey, upperName } from "@/lib/utils";

const driverName = (d: any) => d?.preferred_name || [d?.first_name, d?.last_name].filter(Boolean).join(" ") || "Driver";

/** Route Plans — optimised stop sequence per driver for a day. Mirrors the web page. */
export default function RoutesScreen() {
  const router = useRouter();
  const [date, setDate] = useState(toDateKey(new Date()));
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/routes?date=${d}`);
      const json = await res.json();
      setPlans(json.plans ?? json.routes ?? []);
    } catch { setPlans([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(date); }, [date, load]);

  async function build() {
    setBuilding(true);
    try {
      const res = await apiFetch("/api/admin/routes", { method: "POST", body: JSON.stringify({ date }) });
      const json = await res.json();
      if (json.success) { toast.success(`Built ${json.driversPlanned ?? 0} route(s)`); load(date); }
      else toast.error("Failed to build routes", json.error);
    } catch (e) { toast.error("Failed to build routes", e instanceof Error ? e.message : undefined); }
    finally { setBuilding(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Route Plans</Text>
        <Pressable onPress={build} disabled={building} className="flex-row items-center gap-1.5 rounded-xl bg-brand-purple-800 px-3 py-2">
          {building ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={16} color="#fff" />}
          <Text className="text-sm font-semibold text-white">Build</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="p-4 gap-3 pb-12">
        <View style={{ maxWidth: 220 }}><DateField label="Date" value={date} onChange={setDate} placeholder="Pick date" /></View>

        {loading ? (
          <View className="items-center py-8"><ActivityIndicator color="#7e22ce" /></View>
        ) : plans.length === 0 ? (
          <Card>
            <View className="items-center gap-2 py-6">
              <RouteIcon size={28} color="#cbd5e1" />
              <Text className="text-center text-sm text-slate-400">No route plans for this date. Tap Build to generate them from confirmed jobs.</Text>
            </View>
          </Card>
        ) : (
          plans.map((p) => (
            <Card key={p.id}>
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Text className="font-semibold text-slate-900 dark:text-white">{upperName(driverName(p.driver))}</Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1"><Clock size={14} color="#64748b" /><Text className="text-xs text-slate-500">Start {p.recommended_start}</Text></View>
                  <Text className="text-xs text-slate-500">{p.total_stops} stops</Text>
                  <Text className="text-xs text-slate-500">{p.total_miles} mi</Text>
                </View>
              </View>
              <View className="mt-3 gap-2">
                {(p.stops ?? []).map((s: any, i: number) => (
                  <View key={i} className={`flex-row items-center gap-3 rounded-xl border px-3 py-2 ${s.isBreak ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
                    <View className={`h-7 w-7 items-center justify-center rounded-full ${s.isBreak ? "bg-amber-200" : "bg-brand-purple-100"}`}>
                      {s.isBreak ? <Coffee size={14} color="#92400e" /> : <Text className="text-xs font-bold text-brand-purple-700">{s.seq}</Text>}
                    </View>
                    {s.isBreak ? (
                      <Text className="text-sm font-medium text-amber-800">Break — {s.targetArrival}–{s.targetCompletion}</Text>
                    ) : (
                      <>
                        <View className="flex-1">
                          <Text className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{s.reference}</Text>
                          <View className="flex-row items-center gap-1"><MapPin size={12} color="#94a3b8" /><Text className="text-xs text-slate-500">{s.postcode || "—"} · {s.travelMiles} mi</Text></View>
                        </View>
                        <Text className="text-sm text-slate-600">{s.targetArrival}–{s.targetCompletion}</Text>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
