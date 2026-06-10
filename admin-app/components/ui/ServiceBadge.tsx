import { Badge } from "./Badge";
import { SERVICE_LABELS_SHORT, SERVICE_COLOURS } from "@/lib/constants";
import type { ServiceType } from "@/types";

export function ServiceBadge({ service }: { service: ServiceType }) {
  return <Badge label={SERVICE_LABELS_SHORT[service]} colour={SERVICE_COLOURS[service]} />;
}
