import { useMemo, useState } from "react";
import { View, Text, TextInput, Modal, ScrollView, Pressable } from "react-native";
import { PlusCircle, Package, StepForward, Footprints, Ellipsis, ChevronLeft } from "lucide-react-native";
import { Card, Button, toast } from "@/components/ui";
import { useAddCharge, useExtraRates, type AddChargeInput } from "@/hooks/queries";
import { EXTRA_ITEM_CATALOG } from "@/lib/extra-catalog";
import { calcAutoAmount, type ExtraType } from "@/lib/extra-pricing";
import { colors, radius, spacing, type } from "@/lib/theme";

const TYPE_OPTIONS: { type: ExtraType; label: string; hint: string; icon: typeof Package }[] = [
  { type: "item", label: "Extra item", hint: "Wasn't in the original list", icon: Package },
  { type: "stairs", label: "Extra stairs", hint: "Flights beyond ground access", icon: StepForward },
  { type: "distance", label: "Long carry", hint: "More than 20m walking", icon: Footprints },
  { type: "other", label: "Other", hint: "Describe it yourself", icon: Ellipsis },
];

/** Add an on-site extra charge to a job (goes to the office as pending). */
export function JobExtraButton({ bookingId }: { bookingId: string }) {
  const add = useAddCharge(bookingId);
  const { data: rates } = useExtraRates();
  const [open, setOpen] = useState(false);
  const [extraType, setExtraType] = useState<ExtraType | null>(null);

  // Item
  const [search, setSearch] = useState("");
  const [itemKey, setItemKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  // Stairs
  const [flights, setFlights] = useState("");
  // Distance
  const [distance, setDistance] = useState("");
  // Other
  const [desc, setDesc] = useState("");
  // Final amount — pre-filled from the auto calc, editable
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);

  const itemLabel = itemKey ? EXTRA_ITEM_CATALOG.find((i) => i.key === itemKey)?.label ?? null : null;
  const filteredItems = useMemo(
    () => (search.trim() ? EXTRA_ITEM_CATALOG.filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase())) : EXTRA_ITEM_CATALOG),
    [search]
  );

  const autoAmount = useMemo(() => {
    if (!rates || !extraType) return 0;
    return calcAutoAmount({ extraType, quantity, flights: Number(flights) || 0, distanceMeters: Number(distance) || 0 }, rates);
  }, [rates, extraType, quantity, flights, distance]);

  // Keep the amount field synced to the auto-calc until the driver edits it themselves.
  const displayAmount = amountTouched ? amount : (extraType && extraType !== "other" ? String(autoAmount) : amount);

  function reset() {
    setExtraType(null); setSearch(""); setItemKey(null); setQuantity(1);
    setFlights(""); setDistance(""); setDesc(""); setAmount(""); setAmountTouched(false);
  }

  const amt = parseFloat(displayAmount);
  const canSubmit =
    Number.isFinite(amt) && amt >= 0 &&
    (extraType === "item" ? !!itemKey :
     extraType === "stairs" ? Number(flights) > 0 :
     extraType === "distance" ? Number(distance) > 0 :
     extraType === "other" ? desc.trim().length > 0 : false);

  async function submit() {
    if (!extraType || !canSubmit) { toast.warning("Fill in the details first"); return; }
    const input: AddChargeInput = {
      extraType, amount: amt,
      ...(extraType === "item" ? { itemKey: itemKey!, itemLabel: itemLabel!, quantity } : {}),
      ...(extraType === "stairs" ? { flights: Number(flights) } : {}),
      ...(extraType === "distance" ? { distanceMeters: Number(distance) } : {}),
      ...(extraType === "other" ? { description: desc.trim() } : {}),
    };
    try {
      await add.mutateAsync(input);
      toast.success("Extra added", "Sent to the office to approve");
      setOpen(false); reset();
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
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Extra item, stairs, long carry…</Text>
            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>Add extra charge</Text>
          </View>
        </View>
      </Card>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { setOpen(false); reset(); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, maxHeight: "85%" }}>
            {!extraType ? (
              <>
                <Text style={[type.h2, { color: colors.slate[900] }]}>What's the extra?</Text>
                <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 4, marginBottom: spacing.md }]}>Pick a reason — we'll suggest a price, you can still change it.</Text>
                <View style={{ gap: spacing.sm }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <Pressable key={opt.type} onPress={() => setExtraType(opt.type)}
                      style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, padding: spacing.md }}>
                      <opt.icon size={20} color={colors.accent.DEFAULT} />
                      <View style={{ flex: 1 }}>
                        <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{opt.label}</Text>
                        <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{opt.hint}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
                <View style={{ marginTop: spacing.md }}>
                  <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} fullWidth />
                </View>
              </>
            ) : (
              <>
                <Pressable onPress={() => setExtraType(null)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm }}>
                  <ChevronLeft size={16} color={colors.slate[500]} />
                  <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Back</Text>
                </Pressable>
                <Text style={[type.h2, { color: colors.slate[900] }]}>{TYPE_OPTIONS.find((o) => o.type === extraType)?.label}</Text>

                <ScrollView style={{ marginTop: spacing.md }}>
                  {extraType === "item" && (
                    <>
                      {!itemKey ? (
                        <>
                          <TextInput value={search} onChangeText={setSearch} placeholder="Search items…" placeholderTextColor={colors.slate[400]}
                            style={[type.bodyLarge, { color: colors.slate[900], height: 48, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
                          <View style={{ marginTop: spacing.sm, maxHeight: 260 }}>
                            {filteredItems.slice(0, 40).map((i) => (
                              <Pressable key={i.key} onPress={() => setItemKey(i.key)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
                                <Text style={[type.bodyLarge, { color: colors.slate[800] }]}>{i.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: colors.accent.DEFAULT, borderRadius: radius.md, padding: spacing.md }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{itemLabel}</Text>
                            <Pressable onPress={() => setItemKey(null)}><Text style={[type.bodySmall, { color: colors.accent.DEFAULT }]}>Change item</Text></Pressable>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center" }}>
                              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[700] }]}>−</Text>
                            </Pressable>
                            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900], minWidth: 20, textAlign: "center" }]}>{quantity}</Text>
                            <Pressable onPress={() => setQuantity((q) => q + 1)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center" }}>
                              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[700] }]}>+</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {extraType === "stairs" && (
                    <TextInput value={flights} onChangeText={setFlights} keyboardType="number-pad" placeholder="Extra flights of stairs" placeholderTextColor={colors.slate[400]}
                      style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
                  )}

                  {extraType === "distance" && (
                    <>
                      <TextInput value={distance} onChangeText={setDistance} keyboardType="number-pad" placeholder="Total carry distance (metres)" placeholderTextColor={colors.slate[400]}
                        style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
                      {!!rates && <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 6 }]}>First {rates.distanceFreeMeters}m is free — only the extra gets charged.</Text>}
                    </>
                  )}

                  {extraType === "other" && (
                    <TextInput value={desc} onChangeText={setDesc} placeholder="What's the charge for?" placeholderTextColor={colors.slate[400]}
                      style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
                  )}

                  <View style={{ marginTop: spacing.md }}>
                    <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: 6 }]}>
                      {extraType === "other" ? "Amount (£)" : `Suggested price — edit if needed (£)`}
                    </Text>
                    <TextInput value={displayAmount} onChangeText={(v) => { setAmount(v); setAmountTouched(true); }} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.slate[400]}
                      style={[type.bodyLarge, { color: colors.slate[900], height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }]} />
                  </View>
                </ScrollView>

                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={() => { setOpen(false); reset(); }} fullWidth /></View>
                  <View style={{ flex: 1 }}><Button label="Add" variant="accent" loading={add.isPending} disabled={!canSubmit} onPress={submit} fullWidth /></View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
