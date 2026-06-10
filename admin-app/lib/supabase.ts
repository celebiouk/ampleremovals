import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { ENV } from "./env";

/**
 * Supabase client for the mobile app — same project, same users, same sessions
 * as the web platform.
 *
 * Session persistence uses AsyncStorage, which is the documented, reliable
 * Expo pattern. (Expo SecureStore has a ~2 KB per-value limit that Supabase
 * sessions can exceed, which silently breaks auth — so we avoid it for the
 * session blob. SecureStore is still used elsewhere for small secrets.)
 */
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Drive Supabase token auto-refresh off the app's foreground/background state.
 * Call once from the root layout.
 */
export function registerSupabaseAppStateRefresh(): () => void {
  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
  // Kick it off immediately for the current (active) state.
  supabase.auth.startAutoRefresh();
  return () => sub.remove();
}
