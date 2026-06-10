import { View, Text, TextInput, Pressable } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { formatCurrency } from "@/lib/utils";

export interface LineItem { description: string; quantity: number; unitPrice: number }

const field = {
  borderRadius: 10, borderWidth: 1.5, borderColor: colors.slate[300],
  paddingHorizontal: 12, height: 44, fontFamily: type.body.fontFamily, color: colors.slate[900],
} as const;

export function LineItemsEditor({
  items, onChange,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) {
  function update(i: number, patch: Partial<LineItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <View style={{ gap: 10 }}>
      {items.map((it, i) => (
        <View key={i} style={{ gap: 6, padding: 10, borderRadius: 12, backgroundColor: colors.slate[50], borderWidth: 1, borderColor: colors.slate[100] }}>
          <TextInput
            value={it.description}
            onChangeText={(v) => update(i, { description: v })}
            placeholder="Description (e.g. Removal service)"
            placeholderTextColor={colors.slate[400]}
            style={[field, { backgroundColor: colors.white }]}
          />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ width: 64 }}>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: 2 }]}>Qty</Text>
              <TextInput
                value={String(it.quantity)}
                onChangeText={(v) => update(i, { quantity: Math.max(1, parseInt(v) || 1) })}
                keyboardType="number-pad"
                style={[field, { backgroundColor: colors.white }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: 2 }]}>Unit price £</Text>
              <TextInput
                value={it.unitPrice ? String(it.unitPrice) : ""}
                onChangeText={(v) => update(i, { unitPrice: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.slate[400]}
                style={[field, { backgroundColor: colors.white }]}
              />
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: 2 }]}>Line</Text>
              <View style={{ height: 44, justifyContent: "center", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(it.quantity * it.unitPrice)}
                </Text>
                {items.length > 1 ? (
                  <Pressable onPress={() => remove(i)} hitSlop={8}><Trash2 size={18} color={colors.danger.DEFAULT} /></Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      ))}
      <Pressable onPress={add} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.primary.DEFAULT }}>
        <Plus size={16} color={colors.primary.DEFAULT} />
        <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Add line item</Text>
      </Pressable>
    </View>
  );
}

export function lineItemsTotal(items: LineItem[]): number {
  return items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
}
