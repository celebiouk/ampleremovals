import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { signOut } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export default function ProfileScreen() {
  const { session } = useAuthStore();
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="px-5 pt-2">
        <Text className="text-2xl font-bold text-slate-900">Profile</Text>
        <Text className="mt-1 text-slate-500">{session?.user?.email}</Text>

        {/* Step 4 adds: photo, licence, vehicle, notification prefs, app version. */}

        <Pressable
          onPress={signOut}
          className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50"
        >
          <LogOut size={18} color="#dc2626" />
          <Text className="font-semibold text-red-600">Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
