import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

export default function AdminInvoicesPage() {
  return (
    <PagePlaceholder
      title="Invoices"
      description="Create, send and track deposit and full-balance invoices."
      icon={FileText}
      phase="Phase 5"
    />
  );
}
