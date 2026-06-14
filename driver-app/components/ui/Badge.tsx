import { View, Text } from "react-native";
import { colors, radius, spacing, type } from "@/lib/theme";

interface BadgeProps {
  label: string;
  /** Background + text colour pair. */
  bg?: string;
  fg?: string;
  dot?: boolean;
}

export function Badge({ label, bg = colors.slate[100], fg = colors.slate[700], dot }: BadgeProps) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
        borderRadius: radius.full, backgroundColor: bg,
        paddingHorizontal: spacing.md, paddingVertical: 4,
      }}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: fg }} /> : null}
      <Text style={[type.bodySmall, { color: fg, fontWeight: "700" }]}>{label}</Text>
    </View>
  );
}

/** Per-status colour tints, mirroring the web/admin palette. */
export const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  not_started: { bg: colors.slate[100], fg: colors.slate[600] },
  on_my_way: { bg: colors.primary.surfaceMid, fg: colors.primary.DEFAULT },
  twenty_mins_away: { bg: colors.blue.surface, fg: colors.blue.DEFAULT },
  ten_mins_away: { bg: colors.amber.surface, fg: colors.amber.DEFAULT },
  arrived: { bg: colors.accent.surfaceMid, fg: colors.accent.DEFAULT },
  fifteen_mins_to_delivery: { bg: colors.amber.surface, fg: colors.amber.DEFAULT },
  job_completed: { bg: colors.accent.surfaceMid, fg: colors.accent.DEFAULT },
};

/** Per-service accent colour. */
export const SERVICE_COLOR: Record<string, string> = {
  removals: "#6b21a8",
  man_and_van: "#2563eb",
  house_clearance: "#ea580c",
  house_cleaning: "#0d9488",
  end_of_tenancy: "#db2777",
};
