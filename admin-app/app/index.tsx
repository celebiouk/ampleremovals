import { ScrollView, View, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck } from "lucide-react-native";
import { Card, Button, StatusBadge, ServiceBadge, Badge } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { ENV } from "@/lib/env";

/**
 * Phase 1 placeholder / design-system smoke screen.
 * Proves: navigation, theming (light/dark), Supabase wiring, and the UI kit.
 * Replaced by the auth flow + tab shell in Phase 2.
 */
export default function Home() {
  const scheme = useColorScheme();
  const { initialised, session, userType } = useAuthStore();

  const connected = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="p-5 gap-5">
        {/* Brand header */}
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple-800">
            <Truck size={24} color="#fff" />
          </View>
          <View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Ample Admin</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Mobile platform — Phase 1
            </Text>
          </View>
        </View>

        {/* Connection / auth status */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            System status
          </Text>
          <View className="gap-2">
            <Row label="Theme" value={scheme === "dark" ? "Dark" : "Light"} />
            <Row label="Supabase configured" value={connected ? "Yes" : "No (.env missing)"} />
            <Row label="Auth initialised" value={initialised ? "Yes" : "…"} />
            <Row label="Session" value={session ? "Active" : "None"} />
            <Row label="User type" value={userType ?? "—"} />
          </View>
        </Card>

        {/* Design system preview */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Design system
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            <StatusBadge status="inquiry" />
            <StatusBadge status="deposit_paid_job_confirmed" />
            <StatusBadge status="job_completed" />
          </View>
          <View className="mb-4 flex-row flex-wrap gap-2">
            <ServiceBadge service="removals" />
            <ServiceBadge service="man_and_van" />
            <ServiceBadge service="end_of_tenancy" />
          </View>
          <View className="mb-4 flex-row flex-wrap gap-2">
            <Badge label="Active" colour="bg-green-100 text-green-700" />
            <Badge label="Pending" colour="bg-amber-100 text-amber-700" />
          </View>
          <View className="gap-2">
            <Button label="Primary" variant="primary" />
            <Button label="Accent" variant="secondary" />
            <Button label="Outline" variant="outline" />
          </View>
        </Card>

        <Text className="text-center text-xs text-slate-400">
          Foundation ready. Phase 2 adds login + the tab shell.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}
