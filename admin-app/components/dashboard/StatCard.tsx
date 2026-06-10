import { View, Text } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { Card } from "@/components/ui";

interface StatCardProps {
  label: string;
  value: string;
  /** Optional % delta vs a previous period. */
  delta?: number | null;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, delta, icon }: StatCardProps) {
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;

  return (
    <Card className="flex-1 p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{value}</Text>
      {showDelta ? (
        <View className="mt-1 flex-row items-center gap-1">
          {up ? (
            <TrendingUp size={14} color="#16a34a" />
          ) : (
            <TrendingDown size={14} color="#dc2626" />
          )}
          <Text className={`text-xs font-medium ${up ? "text-green-600" : "text-red-600"}`}>
            {up ? "+" : ""}
            {delta}%
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
