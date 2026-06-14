import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, FlatList, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader, Skeleton, EmptyState, ErrorState, Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Employee = any;

export default function PayeEmployeesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [niNumber, setNiNumber] = useState("");
  const [taxCode, setTaxCode] = useState("1257L");
  const [salary, setSalary] = useState("");
  const [isDirector, setIsDirector] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch("/api/admin/paye/employees");
      const data = await res.json();
      if (data.success) setRows(data.employees); else setError(true);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!firstName.trim() || !lastName.trim()) { Alert.alert("Missing", "Enter a name"); return; }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiFetch("/api/admin/paye/employees", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName, last_name: lastName, ni_number: niNumber || null,
          tax_code: taxCode || "1257L", pay_basis: "salary",
          annual_salary: parseFloat(salary) || 0, is_director: isDirector,
        }),
      });
      if ((await res.json()).success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setFormOpen(false); setFirstName(""); setLastName(""); setNiNumber(""); setTaxCode("1257L"); setSalary(""); setIsDirector(false);
        load();
      } else Alert.alert("Error", "Failed to add");
    } catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Employees" onBack={() => router.back()} />
      <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: spacing.base }}>
        <Button label="Add" size="sm" icon={<Plus size={16} color={colors.white} />} onPress={() => setFormOpen(true)} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.base }}>{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</View>
      ) : error ? (
        <ErrorState message="Couldn't load employees." onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title="No employees" message="Add your staff and director." />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.md }}
          renderItem={({ item: e }) => (
            <Card style={{ padding: spacing.base }}>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{e.first_name} {e.last_name}{e.is_director ? "  · director" : ""}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: 2 }]}>
                {e.tax_code} · {e.pay_basis === "salary" ? `${formatCurrency(e.annual_salary)}/yr` : `${formatCurrency(e.hourly_rate)}/hr`} · {e.status}
              </Text>
            </Card>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>New employee</Text>
            <Pressable onPress={() => setFormOpen(false)}><X size={24} color={colors.slate[400]} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
            <Input label="First name" value={firstName} onChangeText={setFirstName} />
            <Input label="Last name" value={lastName} onChangeText={setLastName} />
            <Input label="NI number" value={niNumber} onChangeText={setNiNumber} autoCapitalize="characters" placeholder="QQ123456C" />
            <Input label="Tax code" value={taxCode} onChangeText={(t) => setTaxCode(t.toUpperCase())} autoCapitalize="characters" />
            <Input label="Annual salary (£)" value={salary} onChangeText={setSalary} keyboardType="decimal-pad" placeholder="0.00" />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.bodySmall, { color: colors.slate[700], flex: 1 }]}>Director (annual NI method)</Text>
              <Switch value={isDirector} onValueChange={setIsDirector} />
            </View>
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>For full details (hourly, student loan, bank, address) edit on the web.</Text>
            <Button label={saving ? "Saving…" : "Save employee"} loading={saving} onPress={save} size="lg" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
