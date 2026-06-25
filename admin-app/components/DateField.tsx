import { useState } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, Clock } from "lucide-react-native";
import { Button } from "@/components/ui";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

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

/** Tap to pick a date/time. Emits YYYY-MM-DD (date) or HH:MM (time). */
export function DateField({
  label, value, onChange, mode = "date", placeholder = "Select",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  mode?: "date" | "time";
  placeholder?: string;
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
    <View className="mb-3">
      {label ? <Text className="mb-1.5 text-xs font-medium text-slate-600">{label}</Text> : null}
      <Pressable onPress={openPicker} className="h-12 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        {mode === "time" ? <Clock size={18} color={colors.slate[400]} /> : <Calendar size={18} color={colors.slate[400]} />}
        <Text style={[type.body, { color: value ? colors.slate[900] : colors.slate[400] }]}>{value || placeholder}</Text>
      </Pressable>

      {Platform.OS === "android" && open && (
        <DateTimePicker value={temp} mode={mode} display="default" onChange={onAndroidChange} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View className="rounded-t-3xl bg-white p-5">
              <DateTimePicker value={temp} mode={mode} display="spinner" onChange={(_, d) => d && setTemp(d)} />
              <View className="mt-2 flex-row gap-2">
                <View className="flex-1"><Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} /></View>
                <View className="flex-1"><Button label="Done" onPress={() => { onChange(fmt(temp, mode)); setOpen(false); }} /></View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
