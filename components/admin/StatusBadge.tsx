import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLOURS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLOURS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
