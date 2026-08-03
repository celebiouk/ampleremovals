import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Building2, MapPin, Navigation } from "lucide-react-native";
import { Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";

interface Distances {
  officePostcode: string;
  officeToOrigin: number | null;
  originToDestination: number | null;
}

/**
 * Shows the two job DRIVING distances (miles) — office → first pickup and
 * pickup → dropoff — from /api/postcode/distances (office read from Settings).
 * Mirrors the web DistancePanel. Renders nothing until there's a pickup postcode.
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
        setData({ officePostcode: d.officePostcode, officeToOrigin: d.officeToOrigin, originToDestination: d.originToDestination });
      })
      .catch(() => { /* leave "—" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [origin, destination]);

  if (!origin) return null;

  const Miles = ({ n }: { n: number | null }) =>
    loading ? <ActivityIndicator size="small" color="#94a3b8" />
      : <Text className="text-sm font-bold text-slate-900">{n == null ? "—" : `${n} mi`}</Text>;

  return (
    <Card className="border-blue-200 bg-blue-50/70">
      <View className="flex-row items-center gap-1.5">
        <Navigation size={14} color="#2563eb" />
        <Text className="text-xs font-bold uppercase tracking-wide text-blue-800">Distances</Text>
      </View>
      <View className="mt-2.5 gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-1.5">
            <Building2 size={16} color="#3b82f6" />
            <Text className="text-slate-600" numberOfLines={1}>
              Office{data?.officePostcode ? ` (${data.officePostcode})` : ""} → pickup
            </Text>
          </View>
          <Miles n={data?.officeToOrigin ?? null} />
        </View>
        {destination ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-1.5">
              <MapPin size={16} color="#3b82f6" />
              <Text className="text-slate-600">Pickup → dropoff</Text>
            </View>
            <Miles n={data?.originToDestination ?? null} />
          </View>
        ) : null}
      </View>
      <Text className="mt-1.5 text-[11px] text-slate-400">Driving distance (via road).</Text>
    </Card>
  );
}
