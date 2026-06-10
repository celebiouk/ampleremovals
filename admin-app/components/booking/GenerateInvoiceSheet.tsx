import { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Calendar } from "lucide-react-native";
import { Button } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { LineItemsEditor, lineItemsTotal, type LineItem } from "./LineItemsEditor";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { formatCurrency, formatDate, toDateKey } from "@/lib/utils";

type InvType = "deposit" | "full_balance";

export function GenerateInvoiceSheet({
  visible, bookingId, onClose, onDone,
}: {
  visible: boolean; bookingId: string; onClose: () => void; onDone: () => void;
}) {
  const [invType, setInvType] = useState<InvType>("deposit");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [vatRate, setVatRate] = useState<0 | 20>(20);
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 864e5));
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const subtotal = lineItemsTotal(items);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  async function generate() {
    if (subtotal <= 0 || items.some((i) => !i.description.trim())) {
      toast.error("Add a description and price to each line");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/invoices/generate", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          type: invType,
          lineItems: items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
          vatRate,
          dueDate: toDateKey(dueDate),
        }),
      });
      toast.success(invType === "deposit" ? "Deposit invoice created" : "Full invoice created", "Find it in Invoices to send");
      onDone();
    } catch (e) {
      toast.error("Failed", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
          <Text style={[type.h3, { color: colors.slate[900] }]}>Generate Invoice</Text>
          <Pressable onPress={onClose}><X size={24} color={colors.slate[400]} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* Type */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>Invoice type</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([["deposit", "Deposit"], ["full_balance", "Full balance"]] as const).map(([val, lbl]) => (
                <Pressable key={val} onPress={() => setInvType(val)} style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: invType === val ? colors.primary.DEFAULT : colors.slate[300], backgroundColor: invType === val ? colors.primary.surface : colors.white }}>
                  <Text style={[type.bodySemiBold, { color: invType === val ? colors.primary.DEFAULT : colors.slate[600] }]}>{lbl}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[type.bodySmall, { color: colors.slate[400], marginTop: 6 }]}>
              Enter the {invType === "deposit" ? "deposit" : "full balance"} amount as line item(s).
            </Text>
          </View>

          <LineItemsEditor items={items} onChange={setItems} />

          {/* VAT */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>VAT</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[20, 0].map((r) => (
                <Pressable key={r} onPress={() => setVatRate(r as 0 | 20)} style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: vatRate === r ? colors.primary.DEFAULT : colors.slate[300], backgroundColor: vatRate === r ? colors.primary.surface : colors.white }}>
                  <Text style={[type.bodySemiBold, { color: vatRate === r ? colors.primary.DEFAULT : colors.slate[600] }]}>{r === 20 ? "20% VAT" : "No VAT"}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Due date */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>Due date</Text>
            <Pressable onPress={() => setShowDate(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate[300], backgroundColor: colors.white }}>
              <Text style={[type.body, { color: colors.slate[900] }]}>{formatDate(dueDate.toISOString())}</Text>
              <Calendar size={18} color={colors.slate[400]} />
            </Pressable>
            {showDate ? (
              <DateTimePicker value={dueDate} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} onChange={(e, d) => { setShowDate(false); if (e.type === "set" && d) setDueDate(d); }} />
            ) : null}
          </View>

          {/* Totals */}
          <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[100], gap: 4 }}>
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <Row label={`VAT (${vatRate}%)`} value={formatCurrency(vatAmount)} />
            <Row label="Total" value={formatCurrency(total)} bold />
          </View>

          <Button label="Generate invoice" onPress={generate} loading={saving} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
      <Text style={[bold ? type.bodyLargeSemiBold : type.body, { color: bold ? colors.slate[900] : colors.slate[500] }]}>{label}</Text>
      <Text style={[bold ? type.bodyLargeSemiBold : type.bodySemiBold, { color: colors.slate[900] }]}>{value}</Text>
    </View>
  );
}
