import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Input, ScreenHeader, Avatar } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/lib/colors";
import { type, fonts } from "@/lib/typography";

/** Split an existing full name into first + the remaining as last name. */
function splitName(full?: string): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function ProfileScreen() {
  const { session } = useAuthStore();
  const meta = session?.user?.user_metadata as { full_name?: string; first_name?: string; last_name?: string } | undefined;
  const initial = meta?.first_name || meta?.last_name
    ? { first: meta?.first_name ?? "", last: meta?.last_name ?? "" }
    : splitName(meta?.full_name);

  const [first, setFirst] = useState(initial.first);
  const [last, setLast] = useState(initial.last);
  const [saving, setSaving] = useState(false);

  const previewName = [first, last].filter(Boolean).join(" ").trim();

  async function save() {
    if (!first.trim()) { toast.error("Please enter your first name"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/admin/profile", {
        method: "PATCH",
        body: JSON.stringify({ firstName: first, lastName: last }),
      });
      // Pull the refreshed metadata into the session so the greeting updates.
      await supabase.auth.refreshSession();
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Couldn't save", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }} edges={["top"]}>
      <ScreenHeader title="My Profile" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        {/* Identity hero */}
        <LinearGradient
          colors={[colors.primary.DEFAULT, colors.primary.light]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ alignItems: "center", padding: 24, borderRadius: 24, gap: 10 }}
        >
          <Avatar name={previewName || "?"} size="xl" />
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: colors.white, textAlign: "center" }}>
            {previewName || "Your name"}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            {session?.user?.email}
          </Text>
        </LinearGradient>

        {/* Edit form */}
        <View style={{ gap: 16 }}>
          <Input label="First name" value={first} onChangeText={setFirst} placeholder="e.g. Rafael" autoCapitalize="words" />
          <Input label="Last name" value={last} onChangeText={setLast} placeholder="e.g. Mendel" autoCapitalize="words" />
          <Button label="Save changes" onPress={save} loading={saving} size="lg" />
          <Text style={[type.bodySmall, { color: colors.slate[400], textAlign: "center" }]}>
            This is the name shown in your dashboard greeting and to your team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
