import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Placeholder — Step 4 replaces this with today's AI-sequenced job list.
export default function TodayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="px-5 pt-2">
        <Text className="text-2xl font-bold text-slate-900">Today</Text>
        <Text className="mt-1 text-slate-500">Your jobs for today will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}
