import { cn } from "@/lib/utils";
import { SERVICE_LABELS_SHORT, SERVICE_COLOURS } from "@/lib/constants";
import type { ServiceType } from "@/types";

export function ServiceBadge({ service }: { service: ServiceType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        SERVICE_COLOURS[service]
      )}
    >
      {SERVICE_LABELS_SHORT[service]}
    </span>
  );
}
