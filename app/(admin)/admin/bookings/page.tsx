import { CalendarCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

export default function AdminBookingsPage() {
  return (
    <PagePlaceholder
      title="Bookings"
      description="View, filter and manage every booking through its lifecycle."
      icon={CalendarCheck}
    />
  );
}
