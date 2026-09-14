import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Check, Wallet } from "lucide-react-native";
import { Screen, Card, Button, toast } from "@/components/ui";
import { DateField } from "@/components/DateField";
import { apiFetch } from "@/lib/api";
import { colors, radius, spacing, type } from "@/lib/theme";

/**
 * A driver/porter did work with no assignment already in the system —
 * request pay for it. Admin approves with an amount (or rejects); see
 * app/api/admin/job-pay-requests/[id]/approve/route.ts.
 */
export default function PayRequestScreen() {
  const router = useRouter();
  const [workDate, setWorkDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!workDate && description.trim().length > 0;

  async function submit() {
    if (!canSubmit) {
      if (!workDate) toast.warning("Pick the date you did the work");
      else toast.warning("Describe the job");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/drivers/job-pay-requests", {
        method: "POST",
        body: JSON.stringify({ workDate, description: description.trim() }),
      });
      toast.success("Request submitted");
      router.back();
    } catch (e) {
      toast.error("Couldn't submit", (e as Error)?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Request pay" subtitle="For work not already assigned in the app" back>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          <Wallet size={18} color={colors.primary.DEFAULT} />
          <Text style={[type.label, { color: colors.primary.DEFAULT }]}>Did a job the office hasn&apos;t assigned yet?</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[700], lineHeight: 22 }]}>
          Tell us what it was and when — the office will review and approve pay for it.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Date of the job</Text>
        <DateField value={workDate} onChange={setWorkDate} />
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>What was the job?</Text>
        <TextInput
          value={description} onChangeText={setDescription} multiline
          placeholder="e.g. Helped move a sofa for a customer near the depot, about 2 hours"
          placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], minHeight: 100, textAlignVertical: "top", borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, padding: spacing.md }]}
        />
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Submit request" icon={<Check size={18} color={colors.white} />} loading={submitting} disabled={!canSubmit} onPress={submit} fullWidth />
      </View>
    </Screen>
  );
}
