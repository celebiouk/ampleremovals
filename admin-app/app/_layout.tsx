import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { supabase, registerSupabaseAppStateRefresh } from "@/lib/supabase";
import { assertEnv } from "@/lib/env";
import { getUserType } from "@/lib/user-type";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const scheme = useColorScheme();
  const { setSession, setUserType, setInitialised } = useAuthStore();

  useEffect(() => {
    assertEnv();
    const stopRefresh = registerSupabaseAppStateRefresh();

    // Hydrate the current session, then resolve admin vs driver.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUserType(session ? await getUserType(session.user.id) : null);
      setInitialised(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
