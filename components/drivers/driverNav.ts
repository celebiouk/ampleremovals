import {
  LayoutDashboard,
  CalendarCheck,
  Truck,
  PoundSterling,
  User,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface DriverNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// Single source of truth for the driver portal menu. The desktop sidebar shows
// all of it; the phone bottom bar shows MOBILE_TABS, and the Profile page
// lists the full set so nothing is unreachable on a phone.
export const DRIVER_NAV_ITEMS: DriverNavItem[] = [
  { name: "Dashboard", href: "/drivers/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/drivers/jobs/today", icon: CalendarCheck },
  { name: "Jobs", href: "/drivers/jobs", icon: Truck },
  { name: "Earnings", href: "/drivers/earnings", icon: PoundSterling },
  { name: "Documents", href: "/drivers/documents", icon: FileText },
  { name: "Profile", href: "/drivers/profile", icon: User },
];

export const DRIVER_MOBILE_TABS: DriverNavItem[] = DRIVER_NAV_ITEMS.filter((i) =>
  ["Today", "Jobs", "Earnings", "Profile"].includes(i.name),
);
