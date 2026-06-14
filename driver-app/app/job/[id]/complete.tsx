import { useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Star } from "lucide-react-native";
import { Screen, Card, Button, toast, Skeleton } from "@/components/ui";
import { useJob } from "@/hooks/queries";
import { apiFetch } from "@/lib/api";
import { stopBackgroundLocation } from "@/lib/location-task";
import { colors, radius, spacing, type } from "@/lib/theme";
import { customerShortName } from "@/lib/format";

export default function CompleteJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const job = useJob(id);
  const [submitting, setSubmitting] = useState(false);

  async function complete() {
    if (!job.data) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/drivers/jobs/${job.data.id}/complete`, { method: "POST" });
      await stopBackgroundLocation();
      await qc.invalidateQueries({ queryKey: ["job", job.data.id] });
      await qc.invalidateQueries({ queryKey: ["jobs"] });
      await qc.invalidateQueries({ queryKey: ["driver-stats"] });
      toast.success("Job completed", "Invoice triggered for the office.");
      router.replace(`/job/${job.data.id}`);
    } catch (e) {
      toast.error("Couldn't complete", (e as Error)?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Complete job" subtitle={job.data?.reference} back>
      {job.isLoading || !job.data ? (
        <Skeleton height={200} rounded={radius.xl} />
      ) : (
        <>
          <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent.surfaceMid, alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={40} color={colors.accent.DEFAULT} />
            </View>
            <Text style={[type.h2, { color: colors.slate[900], marginTop: spacing.md, textAlign: "center" }]}>
              Finish {customerShortName(job.data.customer?.full_name)}&apos;s job
            </Text>
            <Text style={[type.body, { color: colors.slate[500], textAlign: "center", marginTop: 4 }]}>
              Delivery is confirmed and signed. Completing the job triggers the customer&apos;s invoice and review request.
            </Text>
          </Card>

          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <Row icon={<FileText size={18} color={colors.primary.DEFAULT} />} title="Invoice generated" text="The office is notified to send the final invoice." />
            <Row icon={<Star size={18} color={colors.amber.DEFAULT} />} title="Review request" text="The customer is automatically asked to leave a review." />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button label="Complete job" icon={<CheckCircle2 size={18} color={colors.white} />} loading={submitting} onPress={complete} fullWidth />
          </View>
        </>
      )}
    </Screen>
  );
}

function Row({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.slate[50], alignItems: "center", justifyContent: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{title}</Text>
        <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{text}</Text>
      </View>
    </View>
  );
}
