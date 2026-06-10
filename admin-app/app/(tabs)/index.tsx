import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck } from "lucide-react-native";
import { Card, StatusBadge, ServiceBadge } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

export default function DashboardScreen() {
  const { session } = useAuthStore();
  const email = session?.user?.email ?? "admin";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView contentContainerClassName="p-5 gap-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple-800">
            <Truck size={24} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <Card>
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            You&apos;re signed in 🎉
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Authentication and the tab shell are live. Live KPIs, charts, and the activity feed
            arrive in Phase 3.
          </Text>
        </Card>

        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Design system
          </Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            <StatusBadge status="inquiry" />
            <StatusBadge status="deposit_paid_job_confirmed" />
            <StatusBadge status="job_completed" />
          </View>
          <View className="flex-row flex-wrap gap-2">
            <ServiceBadge service="removals" />
            <ServiceBadge service="man_and_van" />
            <ServiceBadge service="end_of_tenancy" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
