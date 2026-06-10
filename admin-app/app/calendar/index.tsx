import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import { ArrowLeft, MapPin, ChevronRight } from "lucide-react-native";
import { Skeleton, ErrorState, EmptyState, StatusBadge, ServiceBadge } from "@/components/ui";
import { useCalendar } from "@/hooks/useCalendar";
import { toDateKey } from "@/lib/utils";

export default function CalendarScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { data, isLoading, isError, refetch } = useCalendar();
  const [selected, setSelected] = useState(toDateKey(new Date()));

  const byDate = useMemo(() => {
    const map: Record<string, typeof data> = {} as any;
    (data ?? []).forEach((b) => {
      (map[b.move_date] ??= [] as any).push(b);
    });
    return map;
  }, [data]);

  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    Object.keys(byDate).forEach((d) => {
      m[d] = { marked: true, dotColor: "#7e22ce" };
    });
    m[selected] = { ...(m[selected] ?? {}), selected: true, selectedColor: "#7e22ce" };
    return m;
  }, [byDate, selected]);

  const dayJobs = byDate[selected] ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">Calendar</Text>
      </View>

      {isLoading ? (
        <View className="p-5 gap-4"><Skeleton className="h-80" /><Skeleton className="h-24" /></View>
      ) : isError ? (
        <ErrorState message="Couldn't load the calendar." onRetry={refetch} />
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
              {new Date(selected + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </Text>

            {dayJobs.length === 0 ? (
              <EmptyState title="No jobs" message="Nothing scheduled for this day." />
            ) : (
              <View className="gap-3">
                {dayJobs.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => router.push(`/booking/${b.id}`)}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <View className="flex-1">
                      <View className="mb-1.5 flex-row flex-wrap gap-2">
                        <ServiceBadge service={b.service_type} />
                        <StatusBadge status={b.status} />
                      </View>
                      <Text className="font-semibold text-slate-900 dark:text-white">{b.customer_name}</Text>
                      <View className="mt-1 flex-row items-center gap-1.5">
                        <MapPin size={14} color="#94a3b8" />
                        <Text className="text-sm text-slate-600 dark:text-slate-300">
                          {b.origin_postcode}{b.destination_postcode ? ` → ${b.destination_postcode}` : ""}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
