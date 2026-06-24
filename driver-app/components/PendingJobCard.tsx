import { useState } from "react";
import { View, Text, TextInput, Modal, Pressable } from "react-native";
import { Check, X } from "lucide-react-native";
import { Card, Button, Badge, toast } from "@/components/ui";
import { useRespondToJob } from "@/hooks/queries";
import { serviceLabel, formatDate } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";
import type { Job } from "@/lib/types";

/** A job the driver hasn't responded to yet — Accept, or Decline with a reason. */
export function PendingJobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const respond = useRespondToJob(job.id);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function accept() {
    try {
      await respond.mutateAsync({ action: "accept" });
      toast.success("Job accepted");
    } catch (e) {
      toast.error("Couldn't accept", (e as Error)?.message);
    }
  }
  async function decline() {
    if (!reason.trim()) { toast.warning("Please give a reason for declining"); return; }
    try {
      await respond.mutateAsync({ action: "decline", reason: reason.trim() });
      setDeclineOpen(false);
      toast.success("Job declined");
    } catch (e) {
      toast.error("Couldn't decline", (e as Error)?.message);
    }
  }

  return (
    <Card style={{ marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.primary.surfaceMid }}>
      <Pressable onPress={onPress}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label="Awaiting response" bg="#fef3c7" fg="#92400e" />
          <Text style={[type.bodySmall, { color: colors.slate[500] }]}>
            {formatDate(job.move_date)}{job.move_time ? ` · ${job.move_time}` : ""}
          </Text>
        </View>
        <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900], marginTop: spacing.sm }]}>{serviceLabel(job.service_type)}</Text>
        <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>
          {job.origin?.postcode ?? "—"}{job.destination?.postcode ? `  →  ${job.destination.postcode}` : ""}
        </Text>
        <Text style={[type.mono, { color: colors.slate[400], marginTop: 4 }]}>{job.reference}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="Accept" variant="accent" icon={<Check size={18} color={colors.white} />} loading={respond.isPending} onPress={accept} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Decline" variant="outline" icon={<X size={18} color={colors.primary.DEFAULT} />} onPress={() => setDeclineOpen(true)} fullWidth />
        </View>
      </View>

      <Modal visible={declineOpen} transparent animationType="fade" onRequestClose={() => setDeclineOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg }}>
            <Text style={[type.h2, { color: colors.slate[900] }]}>Decline this job?</Text>
            <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 4 }]}>
              Please tell us why — this goes to the office so they can reassign.
            </Text>
            <TextInput
              value={reason} onChangeText={setReason} multiline
              placeholder="e.g. Already booked, too far, vehicle issue…" placeholderTextColor={colors.slate[400]}
              style={[type.bodyLarge, { color: colors.slate[900], minHeight: 90, textAlignVertical: "top", borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }]}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={() => setDeclineOpen(false)} fullWidth /></View>
              <View style={{ flex: 1 }}><Button label="Decline job" variant="danger" loading={respond.isPending} onPress={decline} fullWidth /></View>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}
