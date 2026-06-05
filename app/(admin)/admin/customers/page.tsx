import { Users } from "lucide-react";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

export default function AdminCustomersPage() {
  return (
    <PagePlaceholder
      title="Customers"
      description="Browse customer records and their booking history."
      icon={Users}
    />
  );
}
