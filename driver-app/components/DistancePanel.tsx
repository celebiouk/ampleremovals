import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Building2, MapPin, Navigation } from "lucide-react-native";
import { Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors, spacing, type } from "@/lib/theme";

interface Leg {
  miles: number;
  minutes: number;
}

interface Distances {
  officePostcode: string;
  officeToOrigin: Leg | null;
  originToDestination: Leg | null;
  destinationToOffice: Leg | null;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Shows the three job legs — office → pickup, pickup → dropoff, dropoff →
 * back to office — each with driving distance AND typical drive time, so a
 * driver can see at a glance how the day's route adds up. Mirrors the same
 * panel on the web/admin-app. Renders nothing until there's a pickup postcode.
 */
export function DistancePanel({
  originPostcode,
  destinationPostcode,
}: {
  originPostcode?: string | null;
  destinationPostcode?: string | null;
}) {
  const [data, setData] = useState<Distances | null>(null);
  const [loading, setLoading] = useState(false);

  const origin = (originPostcode ?? "").trim();
  const destination = (destinationPostcode ?? "").trim();

  useEffect(() => {
    if (!origin) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/postcode/distances", {
      method: "POST",
      body: JSON.stringify({ origin, destination: destination || undefined }),
    })
      .then((r) => r.json())
      .then((d: { success?: boolean } & Distances) => {
        if (cancelled || !d.success) return;
        setData({
          officePostcode: d.officePostcode,
          officeToOrigin: d.officeToOrigin,
          originToDestination: d.originToDestination,
          destinationToOffice: d.destinationToOffice,
        });
      })
      .catch(() => { /* leave "—" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [origin, destination]);

  if (!origin) return null;

  const LegValue = ({ leg }: { leg: Leg | null }) =>
    loading ? <ActivityIndicator size="small" color={colors.slate[400]} />
      : leg == null ? <Text style={[type.bodySemiBold, { color: colors.slate[400] }]}>—</Text>
      : (
        <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
          {leg.miles} mi <Text style={[type.bodySmall, { color: colors.slate[500] }]}>· {formatMinutes(leg.minutes)}</Text>
        </Text>
      );

  return (
    <Card style={{ borderColor: colors.primary.surfaceMid, backgroundColor: colors.primary.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Navigation size={14} color={colors.primary.DEFAULT} />
        <Text style={[type.label, { color: colors.primary.dark }]}>DISTANCES & DRIVE TIMES</Text>
      </View>
      <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Building2 size={16} color={colors.primary.DEFAULT} />
            <Text style={[type.bodySmall, { color: colors.slate[600] }]} numberOfLines={1}>
              Office{data?.officePostcode ? ` (${data.officePostcode})` : ""} → pickup
            </Text>
          </View>
          <LegValue leg={data?.officeToOrigin ?? null} />
        </View>
        {destination ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MapPin size={16} color={colors.primary.DEFAULT} />
              <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Pickup → dropoff</Text>
            </View>
            <LegValue leg={data?.originToDestination ?? null} />
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Building2 size={16} color={colors.primary.DEFAULT} />
            <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{destination ? "Dropoff" : "Pickup"} → back to office</Text>
          </View>
          <LegValue leg={data?.destinationToOffice ?? null} />
        </View>
      </View>
    </Card>
  );
}
