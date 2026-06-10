import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { signInAdmin } from "@/lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await signInAdmin(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed.");
    }
    // On success the root layout redirects into the app automatically.
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View className="mb-10 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple-800">
              <Truck size={32} color="#fff" />
            </View>
            <View className="rounded-full bg-brand-purple-800/20 px-4 py-1.5">
              <Text className="text-sm font-semibold text-brand-purple-500">Admin Portal</Text>
            </View>
            <Text className="mt-4 text-3xl font-bold text-white">Welcome back</Text>
            <Text className="mt-2 text-slate-400">Sign in to manage your business</Text>
          </View>

          <View className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@ampleremovals.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              className="bg-slate-800 text-white border-slate-700"
              labelClassName="text-slate-300"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              className="bg-slate-800 text-white border-slate-700"
              labelClassName="text-slate-300"
            />

            {error ? (
              <Text className="text-sm text-red-400">{error}</Text>
            ) : null}

            <Button label="Sign In" onPress={handleLogin} loading={loading} size="lg" />

            <Link href="/(auth)/reset-password" className="mt-2 text-center text-sm font-medium text-brand-purple-400">
              Forgot your password?
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
