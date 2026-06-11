import { useEffect, useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, FadeInDown,
} from "react-native-reanimated";
import { Mail, Lock } from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/shared/Logo";
import { toast } from "@/components/ui/Toast";
import { signInAdmin } from "@/lib/auth";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { radius, shadows, spacing } from "@/lib/tokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();

  // Subtle, slow gradient breathe — signals life without distraction.
  const glow = useSharedValue(0.35);
  useEffect(() => {
    if (reduceMotion) return;
    glow.value = withRepeat(withTiming(0.7, { duration: 8000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  async function handleLogin() {
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    const result = await signInAdmin(email, password);
    setLoading(false);
    if (!result.ok) toast.error("Sign in failed", result.error);
    // success → root layout redirects into the app
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary.dark }}>
      {/* Base gradient */}
      <LinearGradient
        colors={[colors.primary.darkest, colors.primary.DEFAULT, colors.primary.light]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", inset: 0 }}
      />
      {/* Breathing highlight layer */}
      <Animated.View style={[{ position: "absolute", inset: 0 }, glowStyle]}>
        <LinearGradient
          colors={[colors.primary.light, "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.base }} keyboardShouldPersistTaps="handled">
            <Animated.View
              entering={FadeInDown.duration(500).springify().damping(18)}
              style={[
                { borderRadius: radius["2xl"], backgroundColor: colors.white, padding: spacing["2xl"] },
                shadows.xl,
              ]}
            >
              {/* Logo mark */}
              <View style={{ alignItems: "center" }}>
                <Logo size={76} />
                <View style={{ marginTop: spacing.base, borderRadius: radius.full, backgroundColor: colors.primary.surfaceMid, paddingHorizontal: spacing.md, paddingVertical: 5 }}>
                  <Text style={[type.label, { color: colors.primary.DEFAULT }]}>Admin Portal</Text>
                </View>
                <Text style={[type.h1, { marginTop: spacing.base, color: colors.slate[900] }]}>Welcome back</Text>
                <Text style={[type.body, { marginTop: 4, color: colors.slate[500] }]}>Sign in to run your business</Text>
              </View>

              {/* Form */}
              <View style={{ marginTop: spacing.xl, gap: spacing.base }}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@ampleremovals.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  leadingIcon={<Mail size={18} color={colors.slate[400]} />}
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  leadingIcon={<Lock size={18} color={colors.slate[400]} />}
                />
                <View style={{ marginTop: spacing.xs }}>
                  <Button label="Sign In" onPress={handleLogin} loading={loading} size="lg" />
                </View>
                <Link href="/(auth)/reset-password" style={{ alignSelf: "center", marginTop: spacing.xs }}>
                  <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Forgot your password?</Text>
                </Link>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
