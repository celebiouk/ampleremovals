import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase, registerSupabaseAppStateRefresh } from "@/lib/supabase";
import { getDriverRecord } from "@/lib/auth";
import { assertEnv } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient();

/** Redirect based on auth: non-drivers → login; signed-in drivers → app. */
function useAuthRedirect() {
  const segments = useSegments();
  const router = useRouter();
  const { initialised, session, driverId } = useAuthStore();

  useEffect(() => {
    if (!initialised) return;
    const inAuthGroup = segments[0] === "(auth)";
    const isDriver = !!session && !!driverId;
    if (!isDriver && !inAuthGroup) router.replace("/(auth)/login");
    else if (isDriver && inAuthGroup) router.replace("/(tabs)");
  }, [initialised, session, driverId, segments, router]);
}

function RootNavigator() {
  useAuthRedirect();
  const { initialised } = useAuthStore();
  if (!initialised) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#6b21a8" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const { setSession, setDriverId, setInitialised } = useAuthStore();

  useEffect(() => {
    assertEnv();
    const stopRefresh = registerSupabaseAppStateRefresh();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setDriverId(session ? (await getDriverRecord(session.user.id))?.id ?? null : null);
      setInitialised(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session);
      setDriverId(session ? (await getDriverRecord(session.user.id))?.id ?? null : null);
    });

    return () => {
      subscription.unsubscribe();
      stopRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
