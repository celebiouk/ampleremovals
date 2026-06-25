import { Tabs } from "expo-router";
import { Home, CalendarDays, User, BarChart3, Receipt } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6b21a8",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { height: 84, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
      <Tabs.Screen name="performance" options={{ title: "Stats", tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} /> }} />
      <Tabs.Screen name="expenses" options={{ title: "Expenses", tabBarIcon: ({ color }) => <Receipt size={22} color={color} /> }} />
      {/* Alerts tab removed — drivers get push notifications; no in-app alerts feed needed. */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
