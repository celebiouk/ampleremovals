import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, FlatList, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Trash2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader, Skeleton, EmptyState, ErrorState, Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";
import { EXPENSE_CATEGORIES, type BusinessExpense } from "@/lib/bookkeeping";

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [categoryOther, setCategoryOther] = useState("");
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [date, setDate] = useState(today());
  const [supplier, setSupplier] = useState("");
  const [isCapital, setIsCapital] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch("/api/admin/bookkeeping/expenses");
      const data = await res.json();
      if (data.success) setRows(data.expenses);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    supabase.from("settings").select("vat_registered").eq("id", 1).single().then(({ data }) => {
      setVatRegistered(!!data?.vat_registered);
    });
  }, [load]);

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount), 0), [rows]);

  function resetForm() {
    setCategory(EXPENSE_CATEGORIES[0]); setCategoryOther(""); setAmount(""); setVatAmount("");
    setDate(today()); setSupplier(""); setIsCapital(false);
  }

  async function save() {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    if (category === "Other" && !categoryOther.trim()) { Alert.alert("Missing", "Type the reason for 'Other'"); return; }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiFetch("/api/admin/bookkeeping/expenses", {
        method: "POST",
        body: JSON.stringify({
          category, category_other: categoryOther || null, amount: amt,
          vat_amount: vatRegistered ? parseFloat(vatAmount) || 0 : 0,
          expense_date: date, supplier: supplier || null, is_capital: isCapital,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setFormOpen(false); resetForm(); load();
      } else Alert.alert("Error", data.error || "Failed to add");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const yes = await new Promise<boolean>((r) =>
      Alert.alert("Delete expense?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel", onPress: () => r(false) },
        { text: "Delete", style: "destructive", onPress: () => r(true) },
      ]));
    if (!yes) return;
    try {
      await apiFetch(`/api/admin/bookkeeping/expenses/${id}`, { method: "DELETE" });
      setRows((x) => x.filter((e) => e.id !== id));
    } catch { /* noop */ }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Expenses" onBack={() => router.back()} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.base }}>
        <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
          Total: <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{formatCurrency(total)}</Text>
        </Text>
        <Button label="Add" size="sm" icon={<Plus size={16} color={colors.white} />} onPress={() => setFormOpen(true)} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.base }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </View>
      ) : error ? (
        <ErrorState message="Couldn't load expenses." onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title="No expenses" message="Add your first company expense." />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.md }}
          renderItem={({ item: r }) => (
            <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {r.category === "Other" ? r.category_other || "Other" : r.category}
                  {r.is_capital ? "  ·  capital" : ""}
                </Text>
                <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: 2 }]}>
                  {formatDate(r.expense_date)}{r.supplier ? `  ·  ${r.supplier}` : ""}
                </Text>
              </View>
              <Text style={[type.bodySemiBold, { color: colors.slate[900], marginRight: spacing.md }]}>{formatCurrency(Number(r.amount))}</Text>
              <Pressable onPress={() => remove(r.id)} hitSlop={8}><Trash2 size={18} color={colors.danger.DEFAULT} /></Pressable>
            </Card>
          )}
        />
      )}

      {/* Add form */}
      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Add expense</Text>
            <Pressable onPress={() => setFormOpen(false)}><X size={24} color={colors.slate[400]} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
            <View>
              <Text style={[type.bodySmall, { color: colors.slate[700], marginBottom: spacing.xs, fontWeight: "600" }]}>Category</Text>
              <Pressable onPress={() => setCatOpen(true)} style={{ borderWidth: 1, borderColor: colors.slate[300], borderRadius: radius.md, padding: spacing.base }}>
                <Text style={[type.body, { color: colors.slate[900] }]}>{category}</Text>
              </Pressable>
            </View>
            {category === "Other" && (
              <Input label="Reason (Other)" value={categoryOther} onChangeText={setCategoryOther} placeholder="Type the reason" />
            )}
            <Input label="Amount (£)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
            {vatRegistered && (
              <Input label="VAT included (£)" value={vatAmount} onChangeText={setVatAmount} keyboardType="decimal-pad" placeholder="0.00" />
            )}
            <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-04-01" autoCapitalize="none" />
            <Input label="Supplier (optional)" value={supplier} onChangeText={setSupplier} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
              <Text style={[type.bodySmall, { color: colors.slate[700], flex: 1 }]}>Capital purchase (van/equipment)</Text>
              <Switch value={isCapital} onValueChange={setIsCapital} />
            </View>
            <Button label={saving ? "Saving…" : "Save expense"} loading={saving} onPress={save} size="lg" />
          </ScrollView>

          {/* Category picker */}
          <Modal visible={catOpen} transparent animationType="fade" onRequestClose={() => setCatOpen(false)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setCatOpen(false)}>
              <Pressable style={{ maxHeight: "70%", backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} onPress={() => {}}>
                <FlatList
                  data={EXPENSE_CATEGORIES as readonly string[]}
                  keyExtractor={(c) => c}
                  contentContainerStyle={{ padding: spacing.base }}
                  renderItem={({ item: c }) => (
                    <Pressable onPress={() => { setCategory(c); setCatOpen(false); }} style={{ paddingVertical: spacing.base }}>
                      <Text style={[type.body, { color: category === c ? colors.primary.DEFAULT : colors.slate[900], fontWeight: category === c ? "700" : "400" }]}>{c}</Text>
                    </Pressable>
                  )}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
