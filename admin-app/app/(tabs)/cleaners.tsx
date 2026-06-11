import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Clock } from "lucide-react-native";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

export default function CleanersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <LargeHeader title="Cleaners" />
      <View className="flex-1 items-center justify-center px-8" style={{ marginTop: -40 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={44} color={colors.primary.DEFAULT} />
        </View>
        <Text style={[type.h2, { marginTop: 20, color: colors.slate[900] }]}>Cleaners</Text>
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primary.surface }}>
          <Clock size={15} color={colors.primary.DEFAULT} />
          <Text style={{ fontFamily: type.bodySemiBold.fontFamily, fontSize: 13, color: colors.primary.DEFAULT }}>Coming soon</Text>
        </View>
        <Text style={[type.body, { marginTop: 16, textAlign: "center", maxWidth: 300, color: colors.slate[500] }]}>
          Manage your cleaning workforce here — registrations, assignments, and
          earnings — alongside your removals drivers. We&apos;re building it now.
        </Text>
      </View>
    </SafeAreaView>
  );
}
