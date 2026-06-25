import { useState } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, Clock } from "lucide-react-native";
import { Button } from "@/components/ui";
import { colors, radius, spacing, type } from "@/lib/theme";

function toDate(value: string, mode: "date" | "time"): Date {
  if (!value) return new Date();
  if (mode === "time") {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }
  return new Date(`${value}T12:00:00`);
}
function fmt(d: Date, mode: "date" | "time"): string {
  const p = (n: number) => String(n).padStart(2, "0");
  if (mode === "time") return `${p(d.getHours())}:${p(d.getMinutes())}`;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Tap to pick a date/time. Emits a YYYY-MM-DD (date) or HH:MM (time) string. */
export function DateField({
  label, value, onChange, mode = "date", placeholder = "Select", minimumDate,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  mode?: "date" | "time";
  placeholder?: string;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(toDate(value, mode));

  function openPicker() {
    setTemp(toDate(value, mode));
    setOpen(true);
  }
  function onAndroidChange(e: DateTimePickerEvent, d?: Date) {
    setOpen(false);
    if (e.type === "set" && d) onChange(fmt(d, mode));
  }

  return (
    <View>
      {label ? <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, height: 52, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }}
      >
        {mode === "time" ? <Clock size={18} color={colors.slate[400]} /> : <Calendar size={18} color={colors.slate[400]} />}
        <Text style={[type.bodyLarge, { color: value ? colors.slate[900] : colors.slate[400] }]}>{value || placeholder}</Text>
      </Pressable>

      {Platform.OS === "android" && open && (
        <DateTimePicker value={temp} mode={mode} display="default" minimumDate={minimumDate} onChange={onAndroidChange} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View style={{ backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg }}>
              <DateTimePicker value={temp} mode={mode} display="spinner" minimumDate={minimumDate} onChange={(_, d) => d && setTemp(d)} />
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} fullWidth /></View>
                <View style={{ flex: 1 }}><Button label="Done" onPress={() => { onChange(fmt(temp, mode)); setOpen(false); }} fullWidth /></View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
