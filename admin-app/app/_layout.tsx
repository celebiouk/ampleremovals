import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase, registerSupabaseAppStateRefresh } from "@/lib/supabase";
import { assertEnv } from "@/lib/env";
import { getUserType } from "@/lib/user-type";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

/**
 * Redirect based on auth state:
 *  - not an admin  → push into the (auth) group (login)
 *  - admin but on an auth screen → push into the (tabs) app
 */
function useAuthRedirect() {
  const segments = useSegments();
  const router = useRouter();
  const { initialised, session, userType, recovering } = useAuthStore();

  useEffect(() => {
    if (!initialised) return;

    // During a password-recovery deep link, force the update-password screen
    // and don't bounce the (recovery) session into the app.
    if (recovering) {
      if (!(segments[0] === "(auth)" && segments[1] === "update-password")) {
        router.replace("/(auth)/update-password");
      }
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const isAdmin = !!session && userType === "admin";

    if (!isAdmin && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAdmin && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [initialised, session, userType, recovering, segments, router]);
}

function RootNavigator() {
  useAuthRedirect();
  const { initialised } = useAuthStore();

  if (!initialised) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#a855f7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="manage-admins" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="customer/index" />
      <Stack.Screen name="customer/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const { setSession, setUserType, setInitialised, setRecovering } = useAuthStore();

  useEffect(() => {
    assertEnv();
    const stopRefresh = registerSupabaseAppStateRefresh();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUserType(session ? await getUserType(session.user.id) : null);
      setInitialised(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(session);
      setUserType(session ? await getUserType(session.user.id) : null);
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
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
