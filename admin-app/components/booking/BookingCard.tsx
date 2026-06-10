import { View, Text, Pressable } from "react-native";
import { MapPin, ChevronRight, Calendar } from "lucide-react-native";
import { StatusBadge, ServiceBadge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { STATUS_ROW } from "@/lib/constants";
import type { BookingRow } from "@/hooks/useBookings";

export function BookingCard({ booking, onPress }: { booking: BookingRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-2xl border border-slate-200 p-4 active:opacity-80",
        STATUS_ROW[booking.status]
      )}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            <ServiceBadge service={booking.service_type} />
            <StatusBadge status={booking.status} />
          </View>

          <Text className="text-lg font-extrabold text-slate-900">
            {booking.customer_name}
          </Text>

          <View className="mt-1 flex-row items-center gap-1.5">
            <MapPin size={16} color="#475569" />
            <Text className="text-base font-semibold text-slate-700">
              {booking.origin_postcode}
              {booking.destination_postcode ? ` → ${booking.destination_postcode}` : ""}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center gap-3">
            <Text className="font-mono text-sm font-bold text-slate-500">{booking.reference}</Text>
            {booking.move_date ? (
              <View className="flex-row items-center gap-1">
                <Calendar size={14} color="#64748b" />
                <Text className="text-sm font-semibold text-slate-500">{formatDate(booking.move_date)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ChevronRight size={22} color="#64748b" />
      </View>
    </Pressable>
  );
}
