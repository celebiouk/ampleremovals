import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Button, Input, Skeleton } from "@/components/ui";
import { useDriverDetail } from "@/hooks/useDrivers";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DRIVER_STATUS_LABELS } from "@/lib/constants";
import type { DriverStatus } from "@/types";

const STATUSES: DriverStatus[] = ["active", "inactive", "suspended", "on_leave"];

export default function EditDriverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useDriverDetail(id!);
  const [f, setF] = useState({
    first_name: "", last_name: "", preferred_name: "", phone: "",
    emergency_contact_name: "", emergency_contact_phone: "", default_pay_percentage: "0",
  });
  const [status, setStatus] = useState<DriverStatus>("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = data?.driver;
    if (d) {
      setF({
        first_name: d.first_name ?? "", last_name: d.last_name ?? "",
        preferred_name: d.preferred_name ?? "", phone: d.phone ?? "",
        emergency_contact_name: (d as any).emergency_contact_name ?? "",
        emergency_contact_phone: (d as any).emergency_contact_phone ?? "",
        default_pay_percentage: String(d.default_pay_percentage ?? 0),
      });
      setStatus(d.status);
    }
  }, [data]);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: f.first_name,
          last_name: f.last_name,
          preferred_name: f.preferred_name || null,
          phone: f.phone,
          emergency_contact_name: f.emergency_contact_name || null,
          emergency_contact_phone: f.emergency_contact_phone || null,
          status,
          default_pay_percentage: parseFloat(f.default_pay_percentage) || 0,
        }),
      });
      qc.invalidateQueries({ queryKey: ["driver", id] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">Edit Driver</Text>
      </View>

      {isLoading ? (
        <View className="gap-3 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</View>
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-3 pb-12" keyboardShouldPersistTaps="handled">
          <Input label="First name" value={f.first_name} onChangeText={(v) => set("first_name", v)} />
          <Input label="Last name" value={f.last_name} onChangeText={(v) => set("last_name", v)} />
          <Input label="Preferred name" value={f.preferred_name} onChangeText={(v) => set("preferred_name", v)} />
          <Input label="Phone" value={f.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
          <Input label="Emergency contact name" value={f.emergency_contact_name} onChangeText={(v) => set("emergency_contact_name", v)} />
          <Input label="Emergency contact phone" value={f.emergency_contact_phone} onChangeText={(v) => set("emergency_contact_phone", v)} keyboardType="phone-pad" />
          <Input label="Default pay %" value={f.default_pay_percentage} onChangeText={(v) => set("default_pay_percentage", v)} keyboardType="numeric" />

          <Text className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={cn("rounded-xl border px-4 py-2.5", status === s ? "border-brand-purple-600 bg-brand-purple-50" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900")}
              >
                <Text className={cn("font-medium", status === s ? "text-brand-purple-800" : "text-slate-600 dark:text-slate-300")}>
                  {DRIVER_STATUS_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button label="Save changes" onPress={save} loading={saving} size="lg" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
