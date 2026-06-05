import Link from "next/link";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

export default function AdminBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-800 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>
      <PagePlaceholder
        title={`Booking ${params.id}`}
        description="Full booking detail, status pipeline, notes and invoicing."
        icon={CalendarCheck}
      />
    </div>
  );
}
