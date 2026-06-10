import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Truck, Search, CalendarClock, Package } from "lucide-react-native";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/colors";
import { type, fonts } from "@/lib/typography";
import { radius, spacing } from "@/lib/tokens";
import { formatCurrency } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

export function DashboardHero({
  email, monthRevenue, monthDelta, todayBookings, weekJobs, onSearch,
}: {
  email?: string | null;
  monthRevenue: number;
  monthDelta: number | null;
  todayBookings: number;
  weekJobs: number;
  onSearch: () => void;
}) {
  const revenue = useCountUp(monthRevenue);

  return (
    <LinearGradient
      colors={[colors.primary.darkest, colors.primary.DEFAULT, colors.primary.light]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: spacing.base,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing["2xl"],
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: "hidden",
      }}
    >
      {/* Decorative depth */}
      <View style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.10)" }} />
      <View style={{ position: "absolute", bottom: -50, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Top row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ width: 46, height: 46, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
          <Truck size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{greeting()} 👋</Text>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.white }} numberOfLines={1}>
            {email ?? "Admin"}
          </Text>
        </View>
        <Pressable
          onPress={onSearch}
          accessibilityLabel="Search"
          style={{ width: 46, height: 46, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}
        >
          <Search size={22} color={colors.white} />
        </Pressable>
      </View>

      {/* Headline metric */}
      <Animated.View entering={FadeInDown.duration(500).springify().damping(18)} style={{ marginTop: spacing.xl }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: "rgba(255,255,255,0.75)", letterSpacing: 0.4 }}>
          Revenue this month
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 46, color: colors.white }}>
            {formatCurrency(revenue)}
          </Text>
          {monthDelta != null ? (
            <View style={{ marginBottom: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: monthDelta >= 0 ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)" }}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.white }}>
                {monthDelta >= 0 ? "▲" : "▼"} {Math.abs(monthDelta)}%
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Glass chips */}
      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
        <Chip icon={<CalendarClock size={18} color={colors.white} />} value={String(todayBookings)} label="Today" />
        <Chip icon={<Package size={18} color={colors.white} />} value={String(weekJobs)} label="This week" />
      </View>
    </LinearGradient>
  );
}

function Chip({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.base, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
      {icon}
      <View>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.white }}>{value}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{label}</Text>
      </View>
    </View>
  );
}
