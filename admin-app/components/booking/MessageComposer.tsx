import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Mail, MessageSquare } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { MESSAGE_TEMPLATES, applyTemplate, type TemplateVars } from "@/lib/message-templates";
import { cn } from "@/lib/utils";

type Mode = "email" | "sms";

interface MessageComposerProps {
  visible: boolean;
  bookingId: string;
  vars: TemplateVars;
  onClose: () => void;
  onSent: () => void;
}

export function MessageComposer({ visible, bookingId, vars, onClose, onSent }: MessageComposerProps) {
  const [mode, setMode] = useState<Mode>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [alsoSms, setAlsoSms] = useState(false);
  const [smsBody, setSmsBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMode("email"); setSubject(""); setBody(""); setAlsoSms(false); setSmsBody("");
    }
  }, [visible]);

  function applyTpl(id: string) {
    const t = MESSAGE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setSubject(applyTemplate(t.subject, vars));
    setBody(applyTemplate(t.body, vars));
    setSmsBody(applyTemplate(t.smsBody, vars));
  }

  async function send() {
    setSending(true);
    try {
      if (mode === "email") {
        if (!subject.trim() || !body.trim()) {
          Alert.alert("Missing", "Enter a subject and message.");
          setSending(false);
          return;
        }
        await apiFetch("/api/admin/send-email", {
          method: "POST",
          body: JSON.stringify({
            bookingId,
            subject: subject.trim(),
            message: body.trim(),
            smsMessage: alsoSms && smsBody.trim() ? smsBody.trim().slice(0, 160) : undefined,
          }),
        });
      } else {
        const msg = (smsBody || body).trim().slice(0, 160);
        if (!msg) {
          Alert.alert("Missing", "Enter a message.");
          setSending(false);
          return;
        }
        await apiFetch("/api/admin/send-sms", {
          method: "POST",
          body: JSON.stringify({ bookingId, message: msg }),
        });
      }
      onSent();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Message customer</Text>
          <Pressable onPress={onClose}><X size={24} color="#94a3b8" /></Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
          {/* Mode toggle */}
          <View className="flex-row gap-2">
            {(["email", "sms"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={cn(
                  "flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3",
                  mode === m
                    ? "border-brand-purple-600 bg-brand-purple-50"
                    : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                )}
              >
                {m === "email" ? <Mail size={16} color="#7e22ce" /> : <MessageSquare size={16} color="#7e22ce" />}
                <Text className={cn("font-semibold", mode === m ? "text-brand-purple-800" : "text-slate-600 dark:text-slate-300")}>
                  {m === "email" ? "Email" : "SMS"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Templates */}
          <View>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
              {MESSAGE_TEMPLATES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => applyTpl(t.id)}
                  className="rounded-full bg-slate-100 px-3.5 py-1.5 dark:bg-slate-800"
                >
                  <Text className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {mode === "email" ? (
            <>
              <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Subject" />
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Write your message…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="min-h-[160px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  textAlignVertical="top"
                />
              </View>
              <Pressable onPress={() => setAlsoSms(!alsoSms)} className="flex-row items-center gap-3">
                <View className={cn("h-5 w-5 items-center justify-center rounded border", alsoSms ? "border-brand-purple-600 bg-brand-purple-600" : "border-slate-400")}>
                  {alsoSms ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                </View>
                <Text className="text-sm text-slate-700 dark:text-slate-300">Also send a short SMS</Text>
              </Pressable>
              {alsoSms ? (
                <Input
                  label={`SMS (${smsBody.length}/160)`}
                  value={smsBody}
                  onChangeText={(v) => setSmsBody(v.slice(0, 160))}
                  placeholder="Short text version"
                />
              ) : null}
            </>
          ) : (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Message ({(smsBody || body).length}/160)
              </Text>
              <TextInput
                value={smsBody || body}
                onChangeText={(v) => { setSmsBody(v.slice(0, 160)); setBody(""); }}
                placeholder="Write your text…"
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={160}
                className="min-h-[100px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                textAlignVertical="top"
              />
            </View>
          )}

          <Button label={mode === "email" ? "Send email" : "Send SMS"} onPress={send} loading={sending} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
