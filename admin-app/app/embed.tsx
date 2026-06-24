import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ENV } from "@/lib/env";

/**
 * Embeds a real web admin page (quote / deposit invoice / full invoice) in an
 * authenticated in-app browser — 100% parity with the web, no native re-build.
 * It opens /embed/auth with the current Supabase session in the URL fragment;
 * that page sets the cookies and redirects into /admin/bookings/[id]?embed=<type>,
 * which auto-opens the matching modal and postMessages back when done.
 */
const TITLES: Record<string, string> = { quote: "Create Quote", deposit: "Deposit Invoice", full: "Full Invoice" };

export default function EmbedScreen() {
  const { bookingId, type } = useLocalSearchParams<{ bookingId: string; type: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.refresh_token) {
        setError("You're signed out — please sign in again.");
        return;
      }
      const next = `/admin/bookings/${bookingId}?embed=${type}`;
      const url =
        `${ENV.SITE_URL}/embed/auth` +
        `#at=${encodeURIComponent(session.access_token)}` +
        `&rt=${encodeURIComponent(session.refresh_token)}` +
        `&next=${encodeURIComponent(next)}`;
      setUri(url);
    })();
  }, [bookingId, type]);

  function onMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg?.type === "embed-done") {
        qc.invalidateQueries({ queryKey: ["booking", bookingId] });
        qc.invalidateQueries({ queryKey: ["invoices"] });
        router.back();
      }
    } catch {
      /* ignore non-JSON messages */
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: TITLES[type ?? ""] ?? "Admin", headerShown: true }} />
      {error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#475569", textAlign: "center" }}>{error}</Text>
        </View>
      ) : !uri ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#6b21a8" />
        </View>
      ) : (
        <WebView
          source={{ uri }}
          onMessage={onMessage}
          startInLoadingState
          domStorageEnabled
          javaScriptEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={{ flex: 1 }}
        />
      )}
    </>
  );
}
