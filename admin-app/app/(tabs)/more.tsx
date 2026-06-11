import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Users, Receipt, CreditCard, CalendarDays, BarChart2, Zap, Settings,
  Bell, Shield, LogOut, ChevronRight, PoundSterling, User, Sparkles, Columns3,
} from "lucide-react-native";
import { signOut, getCurrentAdminRole } from "@/lib/auth";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { useAuthStore } from "@/store/authStore";

type Item = {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  phase?: string;
  href?: string;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Account",
    items: [
      { label: "My Profile", icon: User, href: "/profile" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Cleaners", icon: Sparkles, href: "/cleaners" },
      { label: "Customers", icon: Users, href: "/customer" },
      { label: "Calendar", icon: CalendarDays, href: "/calendar" },
      { label: "Pipeline", icon: Columns3, href: "/pipeline" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", icon: Receipt, href: "/invoice" },
      { label: "Payments", icon: CreditCard, href: "/payments" },
      { label: "Driver Earnings", icon: PoundSterling, href: "/earnings" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Reports", icon: BarChart2, href: "/reports" },
      { label: "Automations", icon: Zap, href: "/automations" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", icon: Bell, href: "/notifications" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    getCurrentAdminRole().then((role) => setIsSuperAdmin(role === "super_admin"));
  }, []);

  function handleItem(item: Item) {
    if (item.href) router.push(item.href as never);
    else Alert.alert(item.label, `This section is coming in ${item.phase}.`);
  }

  function confirmSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-10">
        <LargeHeader title="More" subtitle={session?.user?.email ?? undefined} />

        {GROUPS.map((group) => (
          <View key={group.title} className="mt-5">
            <Text className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.title}
            </Text>
            <View className="mx-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {group.items.map((item, i) => (
                <Row key={item.label} item={item} first={i === 0} onPress={() => handleItem(item)} />
              ))}
            </View>
          </View>
        ))}

        {/* Super-admin only */}
        {isSuperAdmin && (
          <View className="mt-5">
            <Text className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Administration
            </Text>
            <View className="mx-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <Row
                item={{ label: "Manage Admins", icon: Shield }}
                first
                onPress={() => router.push("/manage-admins")}
              />
            </View>
          </View>
        )}

        {/* Sign out */}
        <View className="mx-4 mt-8">
          <Pressable
            onPress={confirmSignOut}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50 dark:border-red-900/50 dark:bg-slate-900"
          >
            <LogOut size={18} color="#dc2626" />
            <Text className="font-semibold text-red-600">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ item, first, onPress }: { item: Item; first: boolean; onPress: () => void }) {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800 ${
        first ? "" : "border-t border-slate-100 dark:border-slate-800"
      }`}
    >
      <Icon size={20} color="#7e22ce" />
      <Text className="flex-1 text-base text-slate-900 dark:text-white">{item.label}</Text>
      {item.phase ? (
        <Text className="text-xs text-slate-400">{item.phase}</Text>
      ) : null}
      <ChevronRight size={18} color="#94a3b8" />
    </Pressable>
  );
}
