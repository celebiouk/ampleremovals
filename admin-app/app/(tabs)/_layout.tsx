import { Tabs } from "expo-router";
import { TabBar } from "@/components/shared/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="cleaners" options={{ title: "Cleaners" }} />
      <Tabs.Screen name="drivers" options={{ title: "Drivers" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      {/* Pipeline stays a route but is reached from the More menu, not the tab bar */}
      <Tabs.Screen name="pipeline" options={{ title: "Pipeline", href: null }} />
    </Tabs>
  );
}
