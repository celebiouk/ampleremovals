import { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert, Platform } from "react-native";
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

export function QuoteSheet({
  visible, bookingId, onClose, onDone,
}: {
  visible: boolean; bookingId: string; onClose: () => void; onDone: () => void;
}) {
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [vatRate, setVatRate] = useState<0 | 20>(20);
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 14 * 864e5));
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);

  const subtotal = lineItemsTotal(items);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  async function save(send: boolean) {
    if (subtotal <= 0 || items.some((i) => !i.description.trim())) {
      toast.error("Add a description and price to each line");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}/quote/save`, {
        method: "POST",
        body: JSON.stringify({
          line_items: items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unitPrice, total: Math.round(i.quantity * i.unitPrice * 100) / 100 })),
          subtotal, vat_rate: vatRate, vat_amount: vatAmount, total,
          valid_until: toDateKey(validUntil), deposit_required: true,
        }),
      });
      if (send) {
        await apiFetch(`/api/admin/bookings/${bookingId}/quote/send`, { method: "POST" });
        toast.success("Quote sent", "Email, SMS & WhatsApp sent to the customer");
      } else {
        toast.success("Quote saved");
      }
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
          <Text style={[type.h3, { color: colors.slate[900] }]}>Create Quote</Text>
          <Pressable onPress={onClose}><X size={24} color={colors.slate[400]} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <LineItemsEditor items={items} onChange={setItems} />

          {/* VAT toggle */}
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

          {/* Valid until */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>Valid until</Text>
            <Pressable onPress={() => setShowDate(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate[300], backgroundColor: colors.white }}>
              <Text style={[type.body, { color: colors.slate[900] }]}>{formatDate(validUntil.toISOString())}</Text>
              <Calendar size={18} color={colors.slate[400]} />
            </Pressable>
            {showDate ? (
              <DateTimePicker value={validUntil} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} onChange={(e, d) => { setShowDate(false); if (e.type === "set" && d) setValidUntil(d); }} />
            ) : null}
          </View>

          {/* Totals */}
          <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[100], gap: 4 }}>
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <Row label={`VAT (${vatRate}%)`} value={formatCurrency(vatAmount)} />
            <Row label="Total" value={formatCurrency(total)} bold />
          </View>

          <View style={{ gap: 8 }}>
            <Button label="Save & Send to customer" onPress={() => save(true)} loading={saving} size="lg" />
            <Button label="Save quote only" variant="outline" onPress={() => save(false)} loading={saving} />
          </View>
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
