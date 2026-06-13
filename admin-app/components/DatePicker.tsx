import { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({ value, onChange, minDate, maxDate }: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1);
    }
    return new Date();
  });

  const currentDate = value ? new Date(value + "T00:00:00Z") : null;

  function formatDateDisplay(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function previousMonth() {
    Haptics.selectionAsync().catch(() => {});
    const newMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1);
    setDisplayMonth(newMonth);
  }

  function nextMonth() {
    Haptics.selectionAsync().catch(() => {});
    const newMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1);
    setDisplayMonth(newMonth);
  }

  function selectDate(day: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const selected = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const dateStr = selected.toISOString().split("T")[0];
    onChange(dateStr);
    setVisible(false);
  }

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);
  const days: (number | null)[] = [...Array(firstDay).fill(null)];
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthYear = displayMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setVisible(true);
        }}
        style={{
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.base,
          borderRadius: radius.md,
          backgroundColor: colors.slate[50],
          borderWidth: 1,
          borderColor: colors.slate[200],
        }}
      >
        <Text style={[type.body, { color: value ? colors.slate[900] : colors.slate[400] }]}>
          {value ? formatDateDisplay(value) : "Select date"}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setVisible(false)}
        >
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: spacing.base,
            }}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Pressable
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.xl,
                padding: spacing.lg,
                width: "100%",
                maxWidth: 360,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Month/year header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
                <Pressable onPress={previousMonth} style={{ padding: spacing.sm }}>
                  <ChevronLeft size={24} color={colors.primary.DEFAULT} />
                </Pressable>
                <Text style={[type.h3, { color: colors.slate[900] }]}>{monthYear}</Text>
                <Pressable onPress={nextMonth} style={{ padding: spacing.sm }}>
                  <ChevronRight size={24} color={colors.primary.DEFAULT} />
                </Pressable>
              </View>

              {/* Weekday headers */}
              <View style={{ flexDirection: "row", marginBottom: spacing.base }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Text
                    key={day}
                    style={[
                      type.bodySmall,
                      { color: colors.slate[600], flex: 1, textAlign: "center", fontWeight: "600" },
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View>
                {Array.from({ length: Math.ceil(days.length / 7) }).map((_, week) => (
                  <View key={week} style={{ flexDirection: "row", marginBottom: spacing.sm }}>
                    {days.slice(week * 7, (week + 1) * 7).map((day, index) => (
                      <Pressable
                        key={`${week}-${index}`}
                        onPress={() => day && selectDate(day)}
                        disabled={!day}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: radius.md,
                          backgroundColor:
                            day && currentDate && day === currentDate.getDate() && currentDate.getMonth() === displayMonth.getMonth()
                              ? colors.primary.DEFAULT
                              : "transparent",
                        }}
                      >
                        {day && (
                          <Text
                            style={[
                              type.body,
                              {
                                color:
                                  currentDate && day === currentDate.getDate() && currentDate.getMonth() === displayMonth.getMonth()
                                    ? colors.white
                                    : colors.slate[900],
                                fontWeight: "500",
                              },
                            ]}
                          >
                            {day}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>

              {/* Close button */}
              <Pressable
                onPress={() => setVisible(false)}
                style={{
                  marginTop: spacing.lg,
                  paddingVertical: spacing.base,
                  alignItems: "center",
                  borderTopWidth: 1,
                  borderTopColor: colors.slate[200],
                }}
              >
                <Text style={[type.body, { color: colors.primary.DEFAULT, fontWeight: "600" }]}>Done</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
