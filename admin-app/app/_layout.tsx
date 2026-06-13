import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { colorScheme as nwColorScheme } from "nativewind";
import { useFonts } from "expo-font";
import {
  BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

// The website is light-only. Lock the app to light so it matches exactly,
// regardless of the device's dark-mode setting.
nwColorScheme.set("light");
import { supabase, registerSupabaseAppStateRefresh } from "@/lib/supabase";
import { assertEnv } from "@/lib/env";
import { getUserType } from "@/lib/user-type";
import { registerForPushNotifications } from "@/lib/push";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { ToastHost } from "@/components/ui/Toast";
import {
  queryClient, asyncStoragePersister, PERSIST_BUSTER, PERSIST_MAX_AGE,
} from "@/lib/query-client";

SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const router = useRouter();
  const { initialised, userType } = useAuthStore();

  // Register for push + handle notification taps once an admin is signed in.
  useEffect(() => {
    if (userType !== "admin") return;
    registerForPushNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { bookingId?: string };
      if (data?.bookingId) router.push(`/booking/${data.bookingId}`);
    });
    return () => sub.remove();
  }, [userType, router]);

  if (!initialised) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#6b21a8" />
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
      <Stack.Screen name="driver/new" />
      <Stack.Screen name="driver/[id]" />
      <Stack.Screen name="driver/[id]/edit" />
      <Stack.Screen name="earnings/index" />
      <Stack.Screen name="payroll/index" />
      <Stack.Screen name="payroll/[id]" />
      <Stack.Screen name="payroll-new" />
      <Stack.Screen name="payslip/[id]" />
      <Stack.Screen name="payslip/[id]/adjustments" />
      <Stack.Screen name="invoice/index" />
      <Stack.Screen name="invoice/[id]" />
      <Stack.Screen name="payments/index" />
      <Stack.Screen name="automations/index" />
      <Stack.Screen name="reports/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="profile/index" />
    </Stack>
  );
}

export default function RootLayout() {
  const theme = useTheme();
  const { setSession, setUserType, setInitialised, setRecovering } = useAuthStore();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

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

  if (!fontsLoaded) return null; // splash stays up until fonts are ready

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: PERSIST_MAX_AGE,
          buster: PERSIST_BUSTER,
          // Only persist successfully-loaded data (never errors/loading states).
          dehydrateOptions: {
            shouldDehydrateQuery: (q) => q.state.status === "success",
          },
        }}
      >
        <SafeAreaProvider>
          <StatusBar style={theme.isDark ? "light" : "dark"} />
          <RootNavigator />
          <ToastHost />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
