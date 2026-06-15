import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { sendPasswordReset } from "@/lib/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setBusy(true);
    const res = await sendPasswordReset(email);
    setBusy(false);
    // Always show success — don't reveal whether an account exists.
    if (res.ok) setSent(true);
    else setError(res.error ?? "Could not send the reset email. Please try again.");
  }

  return (
    <View className="flex-1">
      <LinearGradient colors={["#581c87", "#6b21a8", "#7e22ce"]} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center px-6">
            <Text className="text-3xl font-bold text-white">Reset Password</Text>
            <Text className="mt-1 text-purple-200">We&apos;ll email you a link to set a new password.</Text>

            <View className="mt-8 rounded-3xl bg-white p-6">
              {sent ? (
                <>
                  <Text className="text-lg font-bold text-slate-900">Check your email</Text>
                  <Text className="mt-2 text-sm text-slate-600">
                    If an account exists for{" "}
                    <Text className="font-medium text-slate-900">{email.trim()}</Text>, we&apos;ve sent a
                    link to reset your password. Open it on this phone, choose a new password, then come
                    back here and sign in. The link expires in 1 hour.
                  </Text>
                  <Pressable
                    onPress={() => router.replace("/login")}
                    className="mt-5 items-center rounded-xl bg-brand-purple-800 py-3.5 active:opacity-90"
                  >
                    <Text className="text-base font-bold text-white">Back to sign in</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoFocus
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
                  />
                  {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
                  <Pressable
                    onPress={submit}
                    disabled={busy}
                    className="items-center rounded-xl bg-brand-purple-800 py-3.5 active:opacity-90"
                  >
                    {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-bold text-white">Send reset link</Text>}
                  </Pressable>
                  <Pressable onPress={() => router.back()} className="mt-3 items-center py-2">
                    <Text className="text-sm font-medium text-slate-500">Back to sign in</Text>
                  </Pressable>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
