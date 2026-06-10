import { Badge } from "./Badge";
import { STATUS_LABELS, STATUS_COLOURS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge label={STATUS_LABELS[status]} colour={STATUS_COLOURS[status]} />;
}
