import { View, Text, Pressable } from "react-native";
import { MapPin, ChevronRight, Calendar } from "lucide-react-native";
import { StatusBadge, ServiceBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { BookingRow } from "@/hooks/useBookings";

export function BookingCard({ booking, onPress }: { booking: BookingRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            <ServiceBadge service={booking.service_type} />
            <StatusBadge status={booking.status} />
          </View>

          <Text className="font-semibold text-slate-900 dark:text-white">
            {booking.customer_name}
          </Text>

          <View className="mt-1 flex-row items-center gap-1.5">
            <MapPin size={14} color="#94a3b8" />
            <Text className="text-sm text-slate-600 dark:text-slate-300">
              {booking.origin_postcode}
              {booking.destination_postcode ? ` → ${booking.destination_postcode}` : ""}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center gap-3">
            <Text className="font-mono text-xs text-slate-400">{booking.reference}</Text>
            {booking.move_date ? (
              <View className="flex-row items-center gap-1">
                <Calendar size={12} color="#94a3b8" />
                <Text className="text-xs text-slate-400">{formatDate(booking.move_date)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ChevronRight size={18} color="#94a3b8" />
      </View>
    </Pressable>
  );
}
