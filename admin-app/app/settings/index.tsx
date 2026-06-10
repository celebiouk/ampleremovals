import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Card, Button, Input, Skeleton, ErrorState } from "@/components/ui";
import { useSettings, type Settings } from "@/hooks/useSettings";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useSettings();
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((p) => (p ? { ...p, [k]: v } : p));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").update({
        company_name: form.company_name,
        company_email: form.company_email,
        company_phone: form.company_phone,
        google_review_link: form.google_review_link,
        notify_new_booking: form.notify_new_booking,
        notify_invoice_paid: form.notify_invoice_paid,
        notify_invoice_overdue: form.notify_invoice_overdue,
        notify_move_date_tomorrow: form.notify_move_date_tomorrow,
      }).eq("id", 1);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["settings"] });
      Alert.alert("Saved", "Settings updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const Toggle = ({ label, k }: { label: string; k: keyof Settings }) => (
    <View className="flex-row items-center justify-between py-2.5">
      <Text className="flex-1 pr-3 text-sm text-slate-700 dark:text-slate-200">{label}</Text>
      <Switch
        value={!!form?.[k]}
        onValueChange={(v) => set(k, v as any)}
        trackColor={{ true: "#7e22ce", false: "#cbd5e1" }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Settings</Text>
      </View>

      {isLoading || !form ? (
        <View className="gap-4 p-5"><Skeleton className="h-48" /><Skeleton className="h-40" /></View>
      ) : isError ? (
        <ErrorState message="Couldn't load settings." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="p-5 gap-4 pb-12" keyboardShouldPersistTaps="handled">
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Company</Text>
            <View className="gap-3">
              <Input label="Company name" value={form.company_name ?? ""} onChangeText={(v) => set("company_name", v)} />
              <Input label="Company email" value={form.company_email ?? ""} onChangeText={(v) => set("company_email", v)} autoCapitalize="none" keyboardType="email-address" />
              <Input label="Company phone" value={form.company_phone ?? ""} onChangeText={(v) => set("company_phone", v)} keyboardType="phone-pad" />
              <Input label="Google review link" value={form.google_review_link ?? ""} onChangeText={(v) => set("google_review_link", v)} autoCapitalize="none" />
            </View>
          </Card>

          <Card>
            <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Notification preferences</Text>
            <Text className="mb-2 text-xs text-slate-500">Which events trigger admin alerts.</Text>
            <Toggle label="New booking" k="notify_new_booking" />
            <Toggle label="Invoice paid" k="notify_invoice_paid" />
            <Toggle label="Invoice overdue" k="notify_invoice_overdue" />
            <Toggle label="Move date tomorrow" k="notify_move_date_tomorrow" />
          </Card>

          <Button label="Save settings" onPress={save} loading={saving} size="lg" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
