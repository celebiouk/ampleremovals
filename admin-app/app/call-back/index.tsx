import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Linking, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import { ArrowLeft, Phone, ChevronRight, Clock, PhoneCall } from "lucide-react-native";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui";
import { useCallBacks, cbDayKey, cbTime, type CallBackReminder } from "@/hooks/useCallBacks";
import { toDateKey, upperName } from "@/lib/utils";

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "To call", bg: "#fef3c7", text: "#92400e" },
  sent: { label: "Reminder sent", bg: "#dbeafe", text: "#1d4ed8" },
  completed: { label: "Done", bg: "#dcfce7", text: "#15803d" },
};

export default function CallBackScreen() {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const { data, isLoading, isError, refetch } = useCallBacks();
  const [selected, setSelected] = useState(toDateKey(new Date()));

  const byDate = useMemo(() => {
    const map: Record<string, CallBackReminder[]> = {};
    (data ?? []).forEach((r) => { (map[cbDayKey(r.reminder_datetime)] ??= []).push(r); });
    return map;
  }, [data]);

  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(byDate).forEach(([d, list]) => {
      const hasPending = list.some((r) => r.status === "pending");
      m[d] = { marked: true, dotColor: hasPending ? "#f59e0b" : "#94a3b8" };
    });
    m[selected] = { ...(m[selected] ?? {}), selected: true, selectedColor: "#7e22ce" };
    return m;
  }, [byDate, selected]);

  const dayReminders = (byDate[selected] ?? []).slice().sort((a, b) => a.reminder_datetime.localeCompare(b.reminder_datetime));

  const todayKey = toDateKey(new Date());
  const upcoming = useMemo(
    () => (data ?? [])
      .filter((r) => r.status === "pending" && cbDayKey(r.reminder_datetime) >= todayKey)
      .slice(0, 10),
    [data, todayKey]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Call back</Text>
      </View>

      {isLoading ? (
        <View className="p-5 gap-4"><Skeleton className="h-80" /><Skeleton className="h-24" /></View>
      ) : isError ? (
        <ErrorState message="Couldn't load call-backs." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="pb-10">
          <Calendar
            current={selected}
            markedDates={marked}
            onDayPress={(d) => setSelected(d.dateString)}
            theme={{
              calendarBackground: dark ? "#0f172a" : "#ffffff",
              monthTextColor: dark ? "#ffffff" : "#0f172a",
              dayTextColor: dark ? "#e2e8f0" : "#0f172a",
              textDisabledColor: dark ? "#475569" : "#cbd5e1",
              todayTextColor: "#16a34a",
              arrowColor: "#7e22ce",
              selectedDayBackgroundColor: "#7e22ce",
              selectedDayTextColor: "#ffffff",
            }}
          />

          <View className="px-5 pt-4">
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
              {new Date(selected + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </Text>

            {dayReminders.length === 0 ? (
              <EmptyState title="No call-backs" message="No one to call back on this day." />
            ) : (
              <View className="gap-3">
                {dayReminders.map((r) => (
                  <ReminderCard key={r.id} r={r} onPress={() => r.booking_id && router.push(`/booking/${r.booking_id}`)} />
                ))}
              </View>
            )}

            {upcoming.length > 0 ? (
              <View className="mt-8">
                <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Next call-backs</Text>
                <View className="gap-3">
                  {upcoming.map((r) => (
                    <ReminderCard key={`up-${r.id}`} r={r} showDate onPress={() => r.booking_id && router.push(`/booking/${r.booking_id}`)} />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReminderCard({ r, onPress, showDate }: { r: CallBackReminder; onPress: () => void; showDate?: boolean }) {
  const st = STATUS[r.status] ?? STATUS.pending;
  return (
    <Pressable onPress={onPress} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 rounded-md bg-brand-purple-50 px-2 py-0.5">
            <Clock size={12} color="#7e22ce" />
            <Text className="text-xs font-bold text-brand-purple-800">{cbTime(r.reminder_datetime)}</Text>
          </View>
          {showDate ? (
            <Text className="text-xs font-semibold text-slate-500">
              {new Date(r.reminder_datetime).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" })}
            </Text>
          ) : null}
        </View>
        <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
          <Text style={{ color: st.text, fontSize: 11, fontWeight: "700" }}>{st.label}</Text>
        </View>
      </View>

      <Text className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{upperName(r.customer_name)}</Text>
      {r.reason ? <Text className="mt-0.5 text-sm text-slate-500">{r.reason.replace(/_/g, " ")}</Text> : null}
      {r.notes ? <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.notes}</Text> : null}

      <View className="mt-3 flex-row items-center gap-2">
        {r.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${r.phone}`)} className="flex-row items-center gap-1.5 rounded-lg bg-brand-green-600 px-3 py-2">
            <Phone size={14} color="#fff" />
            <Text className="text-sm font-semibold text-white">Call {r.phone}</Text>
          </Pressable>
        ) : null}
        {r.booking_id ? (
          <View className="flex-row items-center gap-1 rounded-lg border border-slate-200 px-3 py-2">
            <Text className="text-sm font-medium text-slate-600">Booking</Text>
            <ChevronRight size={14} color="#64748b" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
