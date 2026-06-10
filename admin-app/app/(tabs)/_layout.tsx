import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import {
  LayoutDashboard,
  ClipboardList,
  Kanban,
  Truck,
  Menu,
} from "lucide-react-native";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7e22ce",
        tabBarInactiveTintColor: dark ? "#64748b" : "#94a3b8",
        tabBarStyle: {
          backgroundColor: dark ? "#0f172a" : "#ffffff",
          borderTopColor: dark ? "#1e293b" : "#e2e8f0",
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: "Pipeline",
          tabBarIcon: ({ color, size }) => <Kanban color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: "Drivers",
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
