/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, Phone, Mail, Users } from "lucide-react-native";
import { Card, Button, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { upperName } from "@/lib/utils";

/** Porters — crew who assist drivers on larger jobs. Mirrors the web page. */
export default function PortersScreen() {
  const router = useRouter();
  const [porters, setPorters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", default_day_rate: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/porters");
      const json = await res.json();
      if (json.success) setPorters(json.porters);
    } catch (e) { toast.error("Couldn't load porters", e instanceof Error ? e.message : undefined); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function addPorter() {
    if (!form.first_name.trim()) { toast.error("First name is required"); return; }
    setAdding(true);
    try {
      await apiFetch("/api/admin/porters", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          default_day_rate: form.default_day_rate ? Number(form.default_day_rate) : 0,
        }),
      });
      toast.success("Porter added");
      setForm({ first_name: "", last_name: "", phone: "", email: "", default_day_rate: "" });
      setShowForm(false);
      load();
    } catch (e) { toast.error("Failed to add porter", e instanceof Error ? e.message : undefined); }
    finally { setAdding(false); }
  }

  function removePorter(id: string, name: string) {
    Alert.alert("Remove porter", `Remove ${name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try {
          await apiFetch(`/api/admin/porters/${id}`, { method: "DELETE" });
          setPorters((prev) => prev.filter((p) => p.id !== id));
          toast.success("Porter removed");
        } catch (e) { toast.error("Failed to remove", e instanceof Error ? e.message : undefined); }
      } },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Porters</Text>
        <Pressable onPress={() => setShowForm((s) => !s)} className="flex-row items-center gap-1.5 rounded-xl bg-brand-purple-800 px-3 py-2">
          <Plus size={16} color="#fff" /><Text className="text-sm font-semibold text-white">Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="p-4 gap-3 pb-12" keyboardShouldPersistTaps="handled">
        {showForm && (
          <Card>
            <View className="gap-3">
              <Input label="First name" value={form.first_name} onChangeText={set("first_name")} placeholder="First name" />
              <Input label="Last name" value={form.last_name} onChangeText={set("last_name")} placeholder="Last name" />
              <Input label="Phone" value={form.phone} onChangeText={set("phone")} placeholder="07…" keyboardType="phone-pad" />
              <Input label="Email" value={form.email} onChangeText={set("email")} placeholder="name@email.com" autoCapitalize="none" keyboardType="email-address" />
              <Input label="Day rate (£)" value={form.default_day_rate} onChangeText={set("default_day_rate")} placeholder="0.00" keyboardType="decimal-pad" />
              <Button label="Save porter" onPress={addPorter} loading={adding} />
            </View>
          </Card>
        )}

        {loading ? (
          <View className="items-center py-8"><ActivityIndicator color="#7e22ce" /></View>
        ) : porters.length === 0 ? (
          <Card>
            <View className="items-center gap-2 py-6">
              <Users size={28} color="#cbd5e1" />
              <Text className="text-center text-sm text-slate-400">No porters yet. Add your first porter above.</Text>
            </View>
          </Card>
        ) : (
          porters.map((p) => (
            <Card key={p.id}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 dark:text-white">{upperName(`${p.first_name} ${p.last_name ?? ""}`.trim())}</Text>
                  <View className={`mt-1 self-start rounded-full px-2 py-0.5 ${p.status === "active" ? "bg-green-100" : "bg-slate-100"}`}>
                    <Text className={`text-xs font-medium ${p.status === "active" ? "text-green-700" : "text-slate-500"}`}>{p.status}</Text>
                  </View>
                </View>
                <Pressable onPress={() => removePorter(p.id, p.first_name)} className="p-1"><Trash2 size={18} color="#dc2626" /></Pressable>
              </View>
              <View className="mt-2 gap-1">
                {p.phone ? <View className="flex-row items-center gap-2"><Phone size={14} color="#94a3b8" /><Text className="text-sm text-slate-600 dark:text-slate-300">{p.phone}</Text></View> : null}
                {p.email ? <View className="flex-row items-center gap-2"><Mail size={14} color="#94a3b8" /><Text className="text-sm text-slate-600 dark:text-slate-300">{p.email}</Text></View> : null}
                <Text className="text-sm text-slate-500">£{Number(p.default_day_rate || 0).toFixed(2)}/day · {p.job_count} job{p.job_count === 1 ? "" : "s"}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
