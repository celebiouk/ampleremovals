import { View, Text } from "react-native";

interface PipelineBarsProps {
  data: { name: string; value: number; colour: string }[];
}

/** Horizontal proportion bars for the pipeline breakdown. */
export function PipelineBars({ data }: PipelineBarsProps) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;

  return (
    <View className="gap-3">
      {data.map((d) => {
        const pct = Math.round((d.value / total) * 100);
        return (
          <View key={d.name}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-sm text-slate-700 dark:text-slate-300">{d.name}</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                {d.value} <Text className="text-xs font-normal text-slate-400">({pct}%)</Text>
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <View style={{ width: `${pct}%`, backgroundColor: d.colour }} className="h-full rounded-full" />
            </View>
          </View>
        );
      })}
    </View>
  );
}
