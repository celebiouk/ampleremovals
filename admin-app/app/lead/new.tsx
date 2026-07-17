import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, UserPlus, CheckCircle2, Share2, Mail, MessageSquare, Phone } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";

/**
 * Mobile "New Lead" — the same quick-capture as the web admin. Enter name/email/
 * phone; the customer gets an email + SMS + WhatsApp invite with a link to finish
 * their quote themselves.
 */
export default function NewLeadScreen() {
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ reference: string; link: string } | null>(null);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); }

  async function create() {
    if (!f.fullName.trim() || !f.email.trim() || !f.phone.trim()) {
      Alert.alert("Missing info", "Name, email and phone are all required.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/admin/leads/create", {
        method: "POST",
        body: JSON.stringify(f),
      });
      const res = (await response.json()) as { reference: string; link: string };
      setResult({ reference: res.reference, link: res.link });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  function shareLink() {
    if (result) Share.share({ message: `Complete your Ample Removals quote: ${result.link}` });
  }

  function reset() {
    setF({ fullName: "", email: "", phone: "" });
    setResult(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">New Lead</Text>
      </View>

      {result ? (
        <ScrollView contentContainerClassName="p-4 gap-4">
          <View className="items-center gap-2 pt-6">
            <CheckCircle2 size={56} color="#16a34a" />
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Invite sent!</Text>
            <Text className="text-slate-500 dark:text-slate-400">Reference {result.reference}</Text>
          </View>

          <View className="flex-row flex-wrap justify-center gap-2">
            {[{ Icon: Mail, label: "Email" }, { Icon: MessageSquare, label: "SMS" }, { Icon: Phone, label: "WhatsApp" }].map(({ Icon, label }) => (
              <View key={label} className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                <Icon size={15} color="#64748b" />
                <Text className="text-sm text-slate-600 dark:text-slate-300">{label}</Text>
              </View>
            ))}
          </View>

          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Completion link</Text>
            <Text selectable className="text-sm text-brand-purple-700 dark:text-purple-300">{result.link}</Text>
          </View>

          <Button label="Share link" onPress={shareLink} size="lg" icon={<Share2 size={18} color="#fff" />} />
          <Pressable onPress={reset} className="items-center py-3">
            <Text className="font-semibold text-brand-purple-700 dark:text-purple-300">Add another lead</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-3 pb-12" keyboardShouldPersistTaps="handled">
          <View className="mb-1 flex-row items-center gap-2">
            <UserPlus size={18} color="#7e22ce" />
            <Text className="text-slate-500 dark:text-slate-400">Enter the basics — they finish the rest.</Text>
          </View>
          <Input label="Full name *" value={f.fullName} onChangeText={(v) => set("fullName", v)} placeholder="Jane Smith" />
          <Input label="Email *" value={f.email} onChangeText={(v) => set("email", v)} placeholder="jane@example.com" autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone *" value={f.phone} onChangeText={(v) => set("phone", v)} placeholder="07123 456789" keyboardType="phone-pad" />
          <Button label="Complete & send invite" onPress={create} loading={saving} size="lg" />
          <Text className="mt-1 text-center text-xs text-slate-400">
            They&apos;ll get an email, SMS and WhatsApp with a link to finish their quote.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
