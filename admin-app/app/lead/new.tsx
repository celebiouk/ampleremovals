import { useState, useEffect, useCallback } from "react";
import { ScrollView, View, Text, Pressable, Alert, Share, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, UserPlus, CheckCircle2, Share2, Mail, MessageSquare, Phone, ClipboardPaste, Send, Copy } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { parseLeadMessage } from "@/lib/parseLeadMessage";

interface PendingLead {
  id: string;
  reference: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  reminderStage: number;
  link: string | null;
}

/**
 * Mobile "New Lead" — capture name/email/phone (typed or pasted from the agency
 * message), fire the tri-channel invite, and manage pending leads (reminders).
 */
export default function NewLeadScreen() {
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ reference: string; link: string } | null>(null);

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [leads, setLeads] = useState<PendingLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); }

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await apiFetch("/api/admin/leads");
      const data = (await res.json()) as { leads: PendingLead[] };
      setLeads(data.leads ?? []);
    } catch {
      /* non-fatal */
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  function applyPaste() {
    const parsed = parseLeadMessage(pasteText);
    if (!parsed.fullName && !parsed.email && !parsed.phone) {
      Alert.alert("Nothing found", "Couldn't find a name, email or phone in that text.");
      return;
    }
    setF((p) => ({
      fullName: parsed.fullName || p.fullName,
      email: parsed.email || p.email,
      phone: parsed.phone || p.phone,
    }));
    setShowPaste(false);
    setPasteText("");
  }

  async function create() {
    if (!f.fullName.trim() || !f.email.trim() || !f.phone.trim()) {
      Alert.alert("Missing info", "Name, email and phone are all required.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/admin/leads/create", { method: "POST", body: JSON.stringify(f) });
      const res = (await response.json()) as { reference: string; link: string };
      setResult({ reference: res.reference, link: res.link });
      setF({ fullName: "", email: "", phone: "" });
      loadLeads();
    } catch (e) {
      // apiFetch throws with the server error message (incl. the dedup "already added").
      Alert.alert("Couldn't add lead", e instanceof Error ? e.message : "Failed to create lead");
      loadLeads();
    } finally {
      setSaving(false);
    }
  }

  async function sendReminder(id: string) {
    setRemindingId(id);
    try {
      await apiFetch(`/api/admin/leads/${id}/remind`, { method: "POST" });
      Alert.alert("Reminder sent", "Email, SMS and WhatsApp sent.");
      loadLeads();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">New Lead</Text>
      </View>

      <ScrollView contentContainerClassName="p-4 gap-3 pb-16" keyboardShouldPersistTaps="handled">
        {result ? (
          <View className="items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 size={44} color="#16a34a" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Invite sent!</Text>
            <Text className="text-slate-500 dark:text-slate-400">Reference {result.reference}</Text>
            <View className="mt-1 flex-row flex-wrap justify-center gap-2">
              {[{ Icon: Mail, l: "Email" }, { Icon: MessageSquare, l: "SMS" }, { Icon: Phone, l: "WhatsApp" }].map(({ Icon, l }) => (
                <View key={l} className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                  <Icon size={14} color="#64748b" /><Text className="text-sm text-slate-600 dark:text-slate-300">{l}</Text>
                </View>
              ))}
            </View>
            <Button label="Share link" onPress={() => Share.share({ message: `Complete your Ample Removals quote: ${result.link}` })} icon={<Share2 size={18} color="#fff" />} style={{ marginTop: 8, alignSelf: "stretch" }} />
            <Pressable onPress={() => setResult(null)} className="pt-1"><Text className="font-semibold text-brand-purple-700 dark:text-purple-300">Add another lead</Text></Pressable>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setShowPaste((s) => !s)}
              className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-purple-300 py-2.5"
            >
              <ClipboardPaste size={16} color="#7e22ce" />
              <Text className="font-semibold text-brand-purple-700 dark:text-purple-300">Paste lead message to auto-fill</Text>
            </Pressable>
            {showPaste && (
              <View className="gap-2">
                <TextInput
                  value={pasteText}
                  onChangeText={setPasteText}
                  multiline
                  numberOfLines={5}
                  placeholder={"Paste the whole lead message…"}
                  placeholderTextColor="#94a3b8"
                  className="min-h-[110px] rounded-xl border-2 border-slate-200 p-3 text-base text-slate-900 dark:border-slate-700 dark:text-white"
                  textAlignVertical="top"
                />
                <Button label="Extract & prefill" onPress={applyPaste} />
              </View>
            )}

            <Input label="Full name *" value={f.fullName} onChangeText={(v) => set("fullName", v)} placeholder="Jane Smith" />
            <Input label="Email *" value={f.email} onChangeText={(v) => set("email", v)} placeholder="jane@example.com" autoCapitalize="none" keyboardType="email-address" />
            <Input label="Phone *" value={f.phone} onChangeText={(v) => set("phone", v)} placeholder="07123 456789" keyboardType="phone-pad" />
            <Button label="Complete & send invite" onPress={create} loading={saving} size="lg" />
          </>
        )}

        {/* Pending leads */}
        <View className="mt-6 flex-row items-center gap-2">
          <UserPlus size={18} color="#94a3b8" />
          <Text className="text-base font-bold text-slate-900 dark:text-white">Pending leads</Text>
          {!loadingLeads && <Text className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800">{leads.length}</Text>}
        </View>

        {loadingLeads ? (
          <ActivityIndicator color="#7e22ce" style={{ marginTop: 8 }} />
        ) : leads.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400 dark:border-slate-800">
            No pending leads — everyone&apos;s completed their quote.
          </Text>
        ) : (
          leads.map((lead) => (
            <View key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Text className="font-semibold text-slate-900 dark:text-white">{lead.fullName ?? "—"}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">{lead.email} · {lead.phone}</Text>
              <Text className="mt-1 text-xs text-slate-400">
                Added {new Date(lead.createdAt).toLocaleDateString("en-GB")} · {lead.reminderStage > 0 ? `${lead.reminderStage}/5 reminders` : "no reminders yet"}
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => sendReminder(lead.id)}
                  disabled={remindingId === lead.id}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-brand-purple-800 py-2.5"
                >
                  {remindingId === lead.id ? <ActivityIndicator size="small" color="#fff" /> : <Send size={15} color="#fff" />}
                  <Text className="text-sm font-semibold text-white">Send reminder</Text>
                </Pressable>
                {lead.link && (
                  <Pressable
                    onPress={() => Share.share({ message: `Complete your Ample Removals quote: ${lead.link}` })}
                    className="flex-row items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                  >
                    <Copy size={15} color="#64748b" /><Text className="text-sm font-medium text-slate-600 dark:text-slate-300">Link</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
