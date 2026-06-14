import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Trash2, X, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader, Skeleton, ErrorState, Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";
import type { DirectorLoanEntry } from "@/lib/bookkeeping";

interface LoanData {
  entries: DirectorLoanEntry[];
  balance: number;
  overdrawn: boolean;
  overdrawn_amount: number;
  s455_risk: boolean;
  over_10k: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function DirectorLoanScreen() {
  const router = useRouter();
  const [data, setData] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [direction, setDirection] = useState<DirectorLoanEntry["direction"]>("director_to_company");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch("/api/admin/bookkeeping/director-loan");
      const json = await res.json();
      if (json.success) setData(json);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiFetch("/api/admin/bookkeeping/director-loan", {
        method: "POST",
        body: JSON.stringify({ direction, amount: amt, entry_date: date, description: description || null }),
      });
      if ((await res.json()).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setFormOpen(false); setDirection("director_to_company"); setAmount(""); setDate(today()); setDescription("");
        load();
      } else Alert.alert("Error", "Failed to add");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const yes = await new Promise<boolean>((r) =>
      Alert.alert("Delete entry?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel", onPress: () => r(false) },
        { text: "Delete", style: "destructive", onPress: () => r(true) },
      ]));
    if (!yes) return;
    try { await apiFetch(`/api/admin/bookkeeping/director-loan/${id}`, { method: "DELETE" }); load(); } catch { /* noop */ }
  }

  const balance = data?.balance ?? 0;
  const positive = balance >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Director's Loan" onBack={() => router.back()} />

      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.base }}>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-16 rounded-xl" />
        </View>
      ) : error ? (
        <ErrorState message="Couldn't load." onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.md }}>
          {/* Balance */}
          <Card style={{ padding: spacing.lg, backgroundColor: positive ? colors.accent.surface : "#fffbeb" }}>
            <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Current balance</Text>
            <Text style={[type.display, { fontSize: 30, color: positive ? colors.accent.DEFAULT : "#d97706", marginTop: spacing.xs }]}>
              {formatCurrency(Math.abs(balance))}
            </Text>
            <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
              {positive ? "The company owes you (safe credit balance)." : "You owe the company (overdrawn)."}
            </Text>
          </Card>

          {data?.s455_risk && (
            <Card style={{ padding: spacing.base, flexDirection: "row", gap: spacing.sm, backgroundColor: "#fffbeb" }}>
              <AlertTriangle size={20} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: "#92400e" }]}>s455 risk</Text>
                <Text style={[type.bodySmall, { color: "#92400e", marginTop: 2 }]}>
                  Repay within 9 months &amp; 1 day of year-end or the company pays 33.75% s455 tax on {formatCurrency(data.overdrawn_amount)} (refunded once repaid).
                </Text>
              </View>
            </Card>
          )}
          {data?.over_10k && (
            <Card style={{ padding: spacing.base, flexDirection: "row", gap: spacing.sm, backgroundColor: "#fef2f2" }}>
              <AlertTriangle size={20} color={colors.danger.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: colors.danger.DEFAULT }]}>Over £10,000 overdrawn</Text>
                <Text style={[type.bodySmall, { color: colors.danger.DEFAULT, marginTop: 2 }]}>
                  Taxable benefit-in-kind unless you charge HMRC&apos;s official interest rate. Check with your accountant.
                </Text>
              </View>
            </Card>
          )}

          <Button label="Add entry" icon={<Plus size={16} color={colors.white} />} onPress={() => setFormOpen(true)} />

          {/* Ledger */}
          {(data?.entries.length ?? 0) === 0 ? (
            <Text style={[type.bodySmall, { color: colors.slate[500], textAlign: "center", paddingVertical: spacing.lg }]}>No entries yet.</Text>
          ) : (
            data?.entries.map((e) => {
              const inward = e.direction === "director_to_company";
              return (
                <Card key={e.id} style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: inward ? colors.accent.DEFAULT : "#d97706" }]}>{inward ? "Put in" : "Took out"}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: 2 }]}>{formatDate(e.entry_date)}{e.description ? `  ·  ${e.description}` : ""}</Text>
                  </View>
                  <Text style={[type.bodySemiBold, { color: inward ? colors.accent.DEFAULT : "#d97706", marginRight: spacing.md }]}>
                    {inward ? "+" : "−"}{formatCurrency(Number(e.amount))}
                  </Text>
                  <Pressable onPress={() => remove(e.id)} hitSlop={8}><Trash2 size={18} color={colors.danger.DEFAULT} /></Pressable>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add form */}
      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Add entry</Text>
            <Pressable onPress={() => setFormOpen(false)}><X size={24} color={colors.slate[400]} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable onPress={() => setDirection("director_to_company")} style={{ flex: 1, padding: spacing.base, borderRadius: radius.md, borderWidth: 1, borderColor: direction === "director_to_company" ? colors.accent.DEFAULT : colors.slate[300], backgroundColor: direction === "director_to_company" ? colors.accent.surface : colors.white }}>
                <Text style={[type.bodySmall, { color: direction === "director_to_company" ? colors.accent.DEFAULT : colors.slate[600], fontWeight: "600", textAlign: "center" }]}>I put money in</Text>
              </Pressable>
              <Pressable onPress={() => setDirection("company_to_director")} style={{ flex: 1, padding: spacing.base, borderRadius: radius.md, borderWidth: 1, borderColor: direction === "company_to_director" ? "#d97706" : colors.slate[300], backgroundColor: direction === "company_to_director" ? "#fffbeb" : colors.white }}>
                <Text style={[type.bodySmall, { color: direction === "company_to_director" ? "#d97706" : colors.slate[600], fontWeight: "600", textAlign: "center" }]}>I took money out</Text>
              </Pressable>
            </View>
            <Input label="Amount (£)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
            <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-04-01" autoCapitalize="none" />
            <Input label="Description (optional)" value={description} onChangeText={setDescription} />
            <Button label={saving ? "Saving…" : "Save entry"} loading={saving} onPress={save} size="lg" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
