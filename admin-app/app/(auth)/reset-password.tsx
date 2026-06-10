import { useState } from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound, CheckCircle2 } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { sendPasswordReset } from "@/lib/auth";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email) {
      setError("Enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await sendPasswordReset(email);
    setLoading(false);
    if (result.ok) setSent(true);
    else setError(result.error ?? "Could not send reset email.");
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 justify-center px-6">
        {sent ? (
          <View className="items-center gap-3">
            <CheckCircle2 size={48} color="#22c55e" />
            <Text className="text-2xl font-bold text-white">Check your email</Text>
            <Text className="text-center text-slate-400">
              We&apos;ve sent a password reset link to {email}. Open it on this device to set a new
              password.
            </Text>
            <Link href="/(auth)/login" className="mt-4 text-sm font-medium text-brand-purple-400">
              Back to sign in
            </Link>
          </View>
        ) : (
          <>
            <View className="mb-8 items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple-800">
                <KeyRound size={28} color="#fff" />
              </View>
              <Text className="text-2xl font-bold text-white">Reset password</Text>
              <Text className="mt-2 text-center text-slate-400">
                Enter your email and we&apos;ll send you a reset link.
              </Text>
            </View>

            <View className="gap-4">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@ampleremovals.com"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-slate-800 text-white border-slate-700"
                labelClassName="text-slate-300"
              />
              {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
              <Button label="Send reset link" onPress={handleSend} loading={loading} size="lg" />
              <Link href="/(auth)/login" className="mt-2 text-center text-sm font-medium text-brand-purple-400">
                Back to sign in
              </Link>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
