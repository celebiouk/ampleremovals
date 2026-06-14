import "../global.css";
import "@/lib/location-task"; // registers the background GPS TaskManager task at startup
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase, registerSupabaseAppStateRefresh } from "@/lib/supabase";
import { getDriverRecord } from "@/lib/auth";
import { assertEnv } from "@/lib/env";
import { registerForPush } from "@/lib/push";
import { registerAutoFlush } from "@/lib/offline-queue";
import { useAuthStore } from "@/store/authStore";
import { ToastHost } from "@/components/ui";
import { colors } from "@/lib/theme";

// Offline-first: persist the query cache so the app opens with last-known data.
onlineManager.setEventListener((setOnline) => {
  const sub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
  return () => sub();
});

const WEEK = 1000 * 60 * 60 * 24 * 7;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: WEEK, retry: 2, refetchOnReconnect: true, refetchOnWindowFocus: false },
  },
});
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "AMPLE_DRIVER_QUERY_CACHE", throttleTime: 1000 });

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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary.DEFAULT} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job/[id]/index" />
      <Stack.Screen name="job/[id]/pickup" />
      <Stack.Screen name="job/[id]/delivery" />
      <Stack.Screen name="job/[id]/complete" />
    </Stack>
  );
}

export default function RootLayout() {
  const { setSession, setDriverId, setInitialised } = useAuthStore();

  useEffect(() => {
    assertEnv();
    const stopRefresh = registerSupabaseAppStateRefresh();
    const stopFlush = registerAutoFlush();

    async function resolve(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      setSession(session);
      const driverId = session ? (await getDriverRecord(session.user.id))?.id ?? null : null;
      setDriverId(driverId);
      if (driverId) registerForPush();
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await resolve(session);
      setInitialised(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { resolve(session); });

    return () => { subscription.unsubscribe(); stopRefresh(); stopFlush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: WEEK }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <ToastHost />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
