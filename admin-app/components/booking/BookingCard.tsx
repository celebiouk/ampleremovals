import { View, Text, Pressable } from "react-native";
import {
  MapPin, ChevronRight, Calendar, Truck, Package, Boxes, Sparkles, Home,
} from "lucide-react-native";
import { serviceColors, statusColors, colors } from "@/lib/colors";
import { type, fonts } from "@/lib/typography";
import { radius, shadows, spacing } from "@/lib/tokens";
import { SERVICE_LABELS_SHORT, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { BookingRow } from "@/hooks/useBookings";
import type { ServiceType } from "@/types";

const SERVICE_ICON: Record<ServiceType, typeof Truck> = {
  removals: Truck,
  man_and_van: Package,
  house_clearance: Boxes,
  house_cleaning: Sparkles,
  end_of_tenancy: Home,
};

export function BookingCard({ booking, onPress }: { booking: BookingRow; onPress: () => void }) {
  const Icon = SERVICE_ICON[booking.service_type] ?? Truck;
  const serviceColor = serviceColors[booking.service_type] ?? colors.primary.DEFAULT;
  const status = statusColors[booking.status] ?? { bg: colors.primary.surfaceMid, text: colors.primary.DEFAULT, accent: colors.primary.DEFAULT };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${booking.customer_name}, ${STATUS_LABELS[booking.status]}`}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.base,
          borderRadius: radius.xl,
          backgroundColor: status.bg, // whole row tinted by status (like the web)
          borderLeftWidth: 5,
          borderLeftColor: status.accent,
          opacity: pressed ? 0.85 : 1,
        },
        shadows.sm,
      ]}
    >
      {/* Service tile */}
      <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: serviceColor, alignItems: "center", justifyContent: "center" }}>
        <Icon size={24} color={colors.white} />
      </View>

      {/* Body */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={{ flex: 1, fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.slate[900] }} numberOfLines={1}>
            {booking.customer_name}
          </Text>
          {/* Status pill — solid accent so it stands out on the tinted row */}
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, backgroundColor: status.accent }}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.white }} numberOfLines={1}>
              {STATUS_LABELS[booking.status]}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <MapPin size={14} color={colors.slate[400]} />
          <Text style={[type.bodySmall, { fontFamily: fonts.bodyMedium, color: colors.slate[600] }]} numberOfLines={1}>
            {booking.origin_postcode}{booking.destination_postcode ? `  →  ${booking.destination_postcode}` : ""}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: serviceColor }}>{SERVICE_LABELS_SHORT[booking.service_type]}</Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.slate[400] }}>{booking.reference}</Text>
          {booking.move_date ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Calendar size={12} color={colors.slate[400]} />
              <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{formatDate(booking.move_date)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ChevronRight size={20} color={colors.slate[300]} />
    </Pressable>
  );
}
