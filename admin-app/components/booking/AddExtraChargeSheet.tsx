import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronLeft, Package, StepForward, Footprints, Ellipsis } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { useExtraRates, useAddExtraCharge } from "@/hooks/useExtraCharge";
import { EXTRA_ITEM_CATALOG } from "@/lib/extra-catalog";
import { calcAutoAmount, type ExtraType } from "@/lib/extra-pricing";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { upperName } from "@/lib/utils";

const TYPE_OPTIONS: { type: ExtraType; label: string; hint: string; icon: typeof Package }[] = [
  { type: "item", label: "Extra item", hint: "Wasn't in the original list", icon: Package },
  { type: "stairs", label: "Extra stairs", hint: "Flights beyond ground access", icon: StepForward },
  { type: "distance", label: "Long carry", hint: "More than the free allowance", icon: Footprints },
  { type: "other", label: "Other", hint: "Describe it yourself", icon: Ellipsis },
];

/**
 * Admin adds an on-site extra directly — same structured reasons a driver can
 * flag. Unlike a driver's submission, admin adding one IS the approval: it's
 * invoiced and sent to the customer immediately on submit. Mirrors the web's
 * AddExtraChargeModal and driver-app's JobExtraButton.
 */
export function AddExtraChargeSheet({
  visible, bookingId, bookingReference, customerName, onClose, onDone,
}: {
  visible: boolean;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: rates } = useExtraRates();
  const add = useAddExtraCharge(bookingId);

  const [extraType, setExtraType] = useState<ExtraType | null>(null);
  const [search, setSearch] = useState("");
  const [itemKey, setItemKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [flights, setFlights] = useState("");
  const [distance, setDistance] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);

  useEffect(() => {
    if (visible) {
      setExtraType(null); setSearch(""); setItemKey(null); setQuantity(1);
      setFlights(""); setDistance(""); setDesc(""); setAmount(""); setAmountTouched(false);
    }
  }, [visible]);

  const itemLabel = itemKey ? EXTRA_ITEM_CATALOG.find((i) => i.key === itemKey)?.label ?? null : null;
  const filteredItems = useMemo(
    () => (search.trim() ? EXTRA_ITEM_CATALOG.filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase())) : EXTRA_ITEM_CATALOG),
    [search]
  );

  const autoAmount = rates && extraType
    ? calcAutoAmount({ extraType, quantity, flights: Number(flights) || 0, distanceMeters: Number(distance) || 0 }, rates)
    : 0;
  const displayAmount = amountTouched ? amount : (extraType && extraType !== "other" ? String(autoAmount) : amount);
  const amt = parseFloat(displayAmount);

  const canSubmit =
    Number.isFinite(amt) && amt >= 0 &&
    (extraType === "item" ? !!itemKey :
     extraType === "stairs" ? Number(flights) > 0 :
     extraType === "distance" ? Number(distance) > 0 :
     extraType === "other" ? desc.trim().length > 0 : false);

  async function submit() {
    if (!extraType || !canSubmit) { toast.error("Fill in the details first"); return; }
    try {
      const result = await add.mutateAsync({
        extraType, amount: amt,
        ...(extraType === "item" ? { itemKey: itemKey!, itemLabel: itemLabel!, quantity } : {}),
        ...(extraType === "stairs" ? { flights: Number(flights) } : {}),
        ...(extraType === "distance" ? { distanceMeters: Number(distance) } : {}),
        ...(extraType === "other" ? { description: desc.trim() } : {}),
      });
      if (result.invoiced) toast.success("Invoice sent to the customer");
      else toast.warning("Saved, but invoicing/sending failed — check it manually");
      onDone();
    } catch (e) {
      toast.error("Couldn't add the extra", (e as Error)?.message);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
          <View>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Add extra charge</Text>
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{upperName(customerName)} · {bookingReference}</Text>
          </View>
          <Pressable onPress={onClose}><X size={24} color={colors.slate[400]} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          {!extraType ? (
            <View style={{ gap: 10 }}>
              {TYPE_OPTIONS.map((opt) => (
                <Pressable key={opt.type} onPress={() => setExtraType(opt.type)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: 14, padding: 14, backgroundColor: colors.white }}>
                  <opt.icon size={20} color={colors.primary.DEFAULT} />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{opt.label}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{opt.hint}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <>
              <Pressable onPress={() => setExtraType(null)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ChevronLeft size={16} color={colors.slate[500]} />
                <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Back</Text>
              </Pressable>

              {extraType === "item" && (
                !itemKey ? (
                  <View>
                    <Input value={search} onChangeText={setSearch} placeholder="Search items…" />
                    <View style={{ marginTop: 8, maxHeight: 280, borderRadius: 12, borderWidth: 1, borderColor: colors.slate[100] }}>
                      <ScrollView>
                        {filteredItems.slice(0, 40).map((i) => (
                          <Pressable key={i.key} onPress={() => setItemKey(i.key)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
                            <Text style={[type.body, { color: colors.slate[700] }]}>{i.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: colors.primary.DEFAULT, borderRadius: 14, padding: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{itemLabel}</Text>
                      <Pressable onPress={() => setItemKey(null)}><Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Change item</Text></Pressable>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center" }}>
                        <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>−</Text>
                      </Pressable>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900], minWidth: 20, textAlign: "center" }]}>{quantity}</Text>
                      <Pressable onPress={() => setQuantity((q) => q + 1)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center" }}>
                        <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                )
              )}

              {extraType === "stairs" && (
                <Input value={flights} onChangeText={setFlights} keyboardType="number-pad" placeholder="Extra flights of stairs" />
              )}

              {extraType === "distance" && (
                <View>
                  <Input value={distance} onChangeText={setDistance} keyboardType="number-pad" placeholder="Total carry distance (metres)" />
                  {!!rates && <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 6 }]}>First {rates.distanceFreeMeters}m is free — only the extra gets charged.</Text>}
                </View>
              )}

              {extraType === "other" && (
                <Input value={desc} onChangeText={setDesc} placeholder="What's the charge for?" />
              )}

              <Input
                label={extraType === "other" ? "Amount (£)" : "Suggested price — edit if needed (£)"}
                value={displayAmount}
                onChangeText={(v) => { setAmount(v); setAmountTouched(true); }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                leadingIcon={<Text style={{ color: colors.slate[400], fontSize: 16 }}>£</Text>}
              />

              <Button label="Add & send" onPress={submit} loading={add.isPending} disabled={!canSubmit} size="lg" />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
