import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

export default function AdminReportsPage() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Revenue, conversion and service-mix analytics."
      icon={BarChart3}
    />
  );
}
