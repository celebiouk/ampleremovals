import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
// SDK 54's expo-file-system moved the classic cacheDirectory/writeAsStringAsync
// API to the /legacy subpath; the main export is the new File/Paths API.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { X, Calendar } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { formatCurrency, formatDate, toDateKey, upperName } from "@/lib/utils";

const METHODS = ["Bank Transfer", "Card", "Cash", "Other"] as const;

/**
 * Issue a payment receipt for money already received. Admin enters the amount;
 * the server builds a branded PAID receipt PDF (same layout as the web) and
 * returns it as base64 — we save it and open the iOS share sheet. Optionally
 * emails it to the customer too. Mirrors the web GenerateReceiptModal.
 */
export function GenerateReceiptSheet({
  visible, bookingId, bookingReference, customerName, defaultAmount, onClose, onDone,
}: {
  visible: boolean;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  defaultAmount?: number | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(METHODS[0]);
  const [payDate, setPayDate] = useState(() => new Date());
  const [showDate, setShowDate] = useState(false);
  const [description, setDescription] = useState("");
  const [emailCustomer, setEmailCustomer] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : "");
      setMethod(METHODS[0]); setPayDate(new Date()); setDescription("");
      setEmailCustomer(false); setSaving(false);
    }
  }, [visible, defaultAmount]);

  const amountNum = Number(amount);

  async function generate() {
    if (!(amountNum > 0)) { toast.error("Enter the amount the customer paid"); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/bookings/${bookingId}/receipt`, {
        method: "POST",
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod: method,
          paymentDate: toDateKey(payDate),
          description: description.trim() || undefined,
          sendEmail: emailCustomer,
        }),
      });
      const data = await res.json() as { receiptNumber: string; filename: string; pdfBase64: string; emailed: boolean };

      // Save the PDF and open the share sheet (save to Files, AirDrop, print…).
      const filename = data.filename || `${data.receiptNumber}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, data.pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }

      toast.success(data.emailed ? "Receipt generated & emailed" : "Receipt generated", data.receiptNumber);
      onDone();
    } catch (e) {
      toast.error("Couldn't generate the receipt", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
          <View>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Payment Receipt</Text>
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{upperName(customerName)} · {bookingReference}</Text>
          </View>
          <Pressable onPress={onClose}><X size={24} color={colors.slate[400]} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Input
            label="Amount paid"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            leadingIcon={<Text style={{ color: colors.slate[400], fontSize: 16 }}>£</Text>}
          />

          {/* Payment method */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>Payment method</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {METHODS.map((m) => (
                <Pressable key={m} onPress={() => setMethod(m)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: method === m ? colors.primary.DEFAULT : colors.slate[300], backgroundColor: method === m ? colors.primary.surface : colors.white }}>
                  <Text style={[type.bodySemiBold, { color: method === m ? colors.primary.DEFAULT : colors.slate[600] }]}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Payment date */}
          <View>
            <Text style={[type.label, { color: colors.slate[500], marginBottom: 8 }]}>Payment date</Text>
            <Pressable onPress={() => setShowDate(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate[300], backgroundColor: colors.white }}>
              <Text style={[type.body, { color: colors.slate[900] }]}>{formatDate(payDate.toISOString())}</Text>
              <Calendar size={18} color={colors.slate[400]} />
            </Pressable>
            {showDate ? (
              <DateTimePicker value={payDate} mode="date" maximumDate={new Date()} display={Platform.OS === "ios" ? "inline" : "default"} onChange={(e, d) => { setShowDate(false); if (e.type === "set" && d) setPayDate(d); }} />
            ) : null}
          </View>

          <Input
            label="What it's for (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder={`Removals — Booking ${bookingReference}`}
          />

          {/* Email toggle */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.slate[200], backgroundColor: colors.white }}>
            <Text style={[type.body, { color: colors.slate[700], flex: 1 }]}>Also email this receipt to the customer</Text>
            <Switch value={emailCustomer} onValueChange={setEmailCustomer} trackColor={{ true: "#16a34a", false: colors.slate[300] }} />
          </View>

          <Button
            label={`Generate receipt · ${amountNum > 0 ? formatCurrency(amountNum) : "£0.00"}`}
            onPress={generate}
            loading={saving}
            disabled={!(amountNum > 0)}
            size="lg"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
