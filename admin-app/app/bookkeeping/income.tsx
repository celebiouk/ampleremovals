import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, FlatList, Alert } from "react-native";
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
import { INCOME_CATEGORIES, type OtherIncome } from "@/lib/bookkeeping";

const today = () => new Date().toISOString().slice(0, 10);

export default function OtherIncomeScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<OtherIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [vatRegistered, setVatRegistered] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [categoryOther, setCategoryOther] = useState("");
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch("/api/admin/bookkeeping/income");
      const data = await res.json();
      if (data.success) setRows(data.income);
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

  async function save() {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    if (category === "Other" && !categoryOther.trim()) { Alert.alert("Missing", "Type the reason for 'Other'"); return; }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiFetch("/api/admin/bookkeeping/income", {
        method: "POST",
        body: JSON.stringify({
          category, category_other: categoryOther || null, amount: amt,
          vat_amount: vatRegistered ? parseFloat(vatAmount) || 0 : 0,
          income_date: date, description: description || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setFormOpen(false);
        setCategory(INCOME_CATEGORIES[0]); setCategoryOther(""); setAmount(""); setVatAmount(""); setDate(today()); setDescription("");
        load();
      } else Alert.alert("Error", data.error || "Failed to add");
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
    try {
      await apiFetch(`/api/admin/bookkeeping/income/${id}`, { method: "DELETE" });
      setRows((x) => x.filter((e) => e.id !== id));
    } catch { /* noop */ }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Other Income" onBack={() => router.back()} />

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
        <ErrorState message="Couldn't load income." onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title="No other income" message="Add income that doesn't come from bookings." />
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
                </Text>
                <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: 2 }]}>
                  {formatDate(r.income_date)}{r.description ? `  ·  ${r.description}` : ""}
                </Text>
              </View>
              <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginRight: spacing.md }]}>{formatCurrency(Number(r.amount))}</Text>
              <Pressable onPress={() => remove(r.id)} hitSlop={8}><Trash2 size={18} color={colors.danger.DEFAULT} /></Pressable>
            </Card>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Add income</Text>
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
            <Input label="Description (optional)" value={description} onChangeText={setDescription} />
            <Button label={saving ? "Saving…" : "Save income"} loading={saving} onPress={save} size="lg" />
          </ScrollView>

          <Modal visible={catOpen} transparent animationType="fade" onRequestClose={() => setCatOpen(false)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setCatOpen(false)}>
              <Pressable style={{ maxHeight: "70%", backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} onPress={() => {}}>
                <FlatList
                  data={INCOME_CATEGORIES as readonly string[]}
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
