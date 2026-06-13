import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export default function NewDriverScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [f, setF] = useState({
    firstName: "", lastName: "", preferredName: "", dateOfBirth: "",
    email: "", phone: "", emergencyContactName: "", emergencyContactPhone: "",
    defaultPayPercentage: "40",
  });
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); }

  async function create() {
    if (!f.firstName || !f.lastName || !f.dateOfBirth || !f.email || !f.phone) {
      Alert.alert("Missing info", "First name, last name, date of birth, email and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(
        "/api/admin/drivers",
        {
          method: "POST",
          body: JSON.stringify({
            firstName: f.firstName,
            lastName: f.lastName,
            preferredName: f.preferredName || null,
            dateOfBirth: f.dateOfBirth,
            email: f.email,
            phone: f.phone,
            emergencyContactName: f.emergencyContactName || null,
            emergencyContactPhone: f.emergencyContactPhone || null,
            status: "active",
            defaultPayPercentage: parseFloat(f.defaultPayPercentage) || 0,
          }),
        }
      );
      const res = (await response.json()) as {
        success: boolean;
        temporaryPassword: string;
        driver: { id: string };
      };
      qc.invalidateQueries({ queryKey: ["drivers"] });
      Alert.alert(
        "Driver created",
        `Share these login details with the driver:\n\nEmail: ${f.email}\nTemporary password: ${res.temporaryPassword}`,
        [{ text: "Done", onPress: () => router.replace(`/driver/${res.driver.id}`) }]
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create driver");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">New Driver</Text>
      </View>
      <ScrollView contentContainerClassName="p-4 gap-3 pb-12" keyboardShouldPersistTaps="handled">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Personal</Text>
        <Input label="First name *" value={f.firstName} onChangeText={(v) => set("firstName", v)} />
        <Input label="Last name *" value={f.lastName} onChangeText={(v) => set("lastName", v)} />
        <Input label="Preferred name" value={f.preferredName} onChangeText={(v) => set("preferredName", v)} />
        <Input label="Date of birth * (YYYY-MM-DD)" value={f.dateOfBirth} onChangeText={(v) => set("dateOfBirth", v)} placeholder="1990-05-21" autoCapitalize="none" />
        <Input label="Email *" value={f.email} onChangeText={(v) => set("email", v)} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone *" value={f.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />

        <Text className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Emergency contact</Text>
        <Input label="Contact name" value={f.emergencyContactName} onChangeText={(v) => set("emergencyContactName", v)} />
        <Input label="Contact phone" value={f.emergencyContactPhone} onChangeText={(v) => set("emergencyContactPhone", v)} keyboardType="phone-pad" />

        <Text className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Pay</Text>
        <Input label="Default pay %" value={f.defaultPayPercentage} onChangeText={(v) => set("defaultPayPercentage", v)} keyboardType="numeric" />

        <Button label="Create driver" onPress={create} loading={saving} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
