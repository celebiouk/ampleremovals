import { useState } from "react";
import { View, Text, TextInput, Image, ActivityIndicator, Pressable } from "react-native";
import { Camera, Check, Receipt } from "lucide-react-native";
import { Screen, Card, Button, Badge, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui";
import { CameraCapture } from "@/components/CameraCapture";
import { uploadImage } from "@/lib/upload";
import { useExpenses, useSubmitExpense } from "@/hooks/queries";
import { formatDate, formatCurrency } from "@/lib/format";
import { colors, radius, spacing, type } from "@/lib/theme";

const CATEGORIES = ["Fuel", "Parking", "ULEZ / Congestion", "Tolls", "Other"];
const TINT: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  approved: { bg: "#dcfce7", fg: "#166534" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function ExpensesScreen() {
  const list = useExpenses();
  const submit = useSubmitExpense();
  const [category, setCategory] = useState("Fuel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<{ uri: string; path?: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function addReceipt(uri: string) {
    setCameraOpen(false);
    setReceipt({ uri });
    setUploading(true);
    try {
      const { path } = await uploadImage(uri, `expenses/${Date.now()}`);
      setReceipt({ uri, path });
    } catch (e) {
      toast.error("Receipt upload failed", (e as Error)?.message);
      setReceipt(null);
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.warning("Enter a valid amount"); return; }
    try {
      await submit.mutateAsync({ category, amount: amt, note: note.trim() || undefined, receipt_url: receipt?.path });
      toast.success("Expense submitted", "Sent to the office for approval");
      setAmount(""); setNote(""); setReceipt(null);
    } catch (e) {
      toast.error("Couldn't submit", (e as Error)?.message);
    }
  }

  return (
    <Screen title="Expenses" back onRefresh={() => list.refetch()} refreshing={list.isRefetching}>
      <Card>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>New expense</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} style={{ paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: category === c ? colors.primary.DEFAULT : colors.slate[100] }}>
              <Text style={[type.bodySmall, { color: category === c ? colors.white : colors.slate[600], fontWeight: "600" }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount (£)" placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm }]} />
        <TextInput value={note} onChangeText={setNote} placeholder="Note (optional)" placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm }]} />
        {receipt ? (
          <View style={{ marginBottom: spacing.sm }}>
            <Image source={{ uri: receipt.uri }} style={{ width: "100%", height: 150, borderRadius: radius.md }} />
            {uploading ? <ActivityIndicator style={{ marginTop: 6 }} color={colors.primary.DEFAULT} /> : null}
          </View>
        ) : null}
        <Button label={receipt ? "Retake receipt" : "Add receipt photo"} variant="outline" icon={<Camera size={18} color={colors.primary.DEFAULT} />} onPress={() => setCameraOpen(true)} fullWidth />
        <View style={{ marginTop: spacing.md }}>
          <Button label="Submit expense" icon={<Check size={18} color={colors.white} />} loading={submit.isPending} disabled={uploading} onPress={send} fullWidth />
        </View>
      </Card>

      <Text style={[type.label, { color: colors.slate[500], marginTop: spacing.lg, marginBottom: spacing.sm }]}>Your expenses</Text>
      {list.isLoading ? (
        <Skeleton height={80} rounded={radius.xl} />
      ) : list.isError ? (
        <ErrorState message={(list.error as Error)?.message} onRetry={() => list.refetch()} />
      ) : (list.data?.length ?? 0) === 0 ? (
        <EmptyState title="No expenses yet" message="Submitted expenses appear here." icon={<Receipt size={44} color={colors.primary.lighter} />} />
      ) : (
        (list.data ?? []).map((e) => {
          const tint = TINT[e.status] ?? TINT.pending;
          return (
            <Card key={e.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{formatCurrency(e.amount)}</Text>
                <Badge label={e.status} bg={tint.bg} fg={tint.fg} />
              </View>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>
                {e.category}{e.note ? ` · ${e.note}` : ""} · {formatDate(e.created_at)}
              </Text>
            </Card>
          );
        })
      )}

      <CameraCapture visible={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={addReceipt} />
    </Screen>
  );
}
