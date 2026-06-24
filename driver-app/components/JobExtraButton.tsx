import { useState } from "react";
import { View, Text, TextInput, Modal } from "react-native";
import { PlusCircle } from "lucide-react-native";
import { Card, Button, toast } from "@/components/ui";
import { useAddCharge } from "@/hooks/queries";
import { colors, radius, spacing, type } from "@/lib/theme";

/** Add an on-site extra charge to a job (goes to the office as pending). */
export function JobExtraButton({ bookingId }: { bookingId: string }) {
  const add = useAddCharge(bookingId);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  async function submit() {
    const amt = parseFloat(amount);
    if (!desc.trim()) { toast.warning("Describe the charge"); return; }
    if (!amt || amt < 0) { toast.warning("Enter a valid amount"); return; }
    try {
      await add.mutateAsync({ description: desc.trim(), amount: amt });
      toast.success("Extra added", "Sent to the office to approve");
      setOpen(false); setDesc(""); setAmount("");
    } catch (e) {
      toast.error("Couldn't add", (e as Error)?.message);
    }
  }

  return (
    <>
      <Card style={{ marginTop: spacing.base }} onPress={() => setOpen(true)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accent.surfaceMid, alignItems: "center", justifyContent: "center" }}>
            <PlusCircle size={18} color={colors.accent.DEFAULT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Extra boxes, long carry, waiting time…</Text>
            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>Add extra charge</Text>
          </View>
        </View>
      </Card>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg }}>
            <Text style={[type.h2, { color: colors.slate[900] }]}>Add extra charge</Text>
            <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 4 }]}>Goes to the office to approve before it's added to the invoice.</Text>
            <TextInput value={desc} onChangeText={setDesc} placeholder="What's the charge for?" placeholderTextColor={colors.slate[400]}
              style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.md }]} />
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount (£)" placeholderTextColor={colors.slate[400]}
              style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.sm }]} />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} fullWidth /></View>
              <View style={{ flex: 1 }}><Button label="Add" variant="accent" loading={add.isPending} onPress={submit} fullWidth /></View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
