import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Hammer } from "lucide-react-native";

/** Temporary "coming in a later phase" screen for tabs not yet built. */
export function ScreenPlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">{title}</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Hammer size={40} color="#94a3b8" />
        <Text className="mt-4 text-center text-base font-semibold text-slate-700 dark:text-slate-200">
          Coming in {phase}
        </Text>
        <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          The foundation and navigation are in place — this screen gets built next.
        </Text>
      </View>
    </SafeAreaView>
  );
}
