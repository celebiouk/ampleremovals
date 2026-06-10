import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { updatePassword } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

/**
 * Reached via the password-reset deep link (ampleadmin://update-password).
 * Supabase has already created a recovery session by the time we land here,
 * so we just set the new password.
 */
export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.ok) {
      useAuthStore.getState().setRecovering(false);
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Could not update password.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple-800">
            <KeyRound size={28} color="#fff" />
          </View>
          <Text className="text-2xl font-bold text-white">Set a new password</Text>
        </View>
        <View className="gap-4">
          <Input
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            secureTextEntry
            className="bg-slate-800 text-white border-slate-700"
            labelClassName="text-slate-300"
          />
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-type password"
            secureTextEntry
            className="bg-slate-800 text-white border-slate-700"
            labelClassName="text-slate-300"
          />
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          <Button label="Update password" onPress={handleUpdate} loading={loading} size="lg" />
        </View>
      </View>
    </SafeAreaView>
  );
}
