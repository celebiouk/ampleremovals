import {
  Truck,
  PackageOpen,
  Sofa,
  Sparkles,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { ServiceType } from "@/types";

export interface ServiceMeta {
  service: ServiceType;
  /** URL slug used by /booking/[service]. */
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceMeta[] = [
  {
    service: "removals",
    slug: "removals",
    title: "Home & Business Removals",
    shortTitle: "Removals",
    description:
      "Full-service domestic and commercial moves, handled door to door by an experienced, fully insured team.",
    icon: Truck,
  },
  {
    service: "house_clearance",
    slug: "house-clearance",
    title: "House Clearance",
    shortTitle: "House Clearance",
    description:
      "Full, partial or single-room clearances with responsible disposal and recycling of unwanted items.",
    icon: PackageOpen,
  },
  {
    service: "man_and_van",
    slug: "man-and-van",
    title: "Man & Van",
    shortTitle: "Man & Van",
    description:
      "Flexible, affordable help for smaller moves and deliveries — choose the van size that fits the job.",
    icon: Sofa,
  },
  {
    service: "house_cleaning",
    slug: "house-cleaning",
    title: "House Cleaning",
    shortTitle: "House Cleaning",
    description:
      "Regular, deep or one-off cleaning by vetted professionals, scheduled around your routine.",
    icon: Sparkles,
  },
  {
    service: "end_of_tenancy",
    slug: "end-of-tenancy",
    title: "End of Tenancy",
    shortTitle: "End of Tenancy",
    description:
      "Deposit-back guarantee cleaning that meets letting-agent and landlord checkout standards.",
    icon: KeyRound,
  },
];

export const SERVICE_BY_SLUG: Record<string, ServiceMeta> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, s])
);

export const SERVICE_BY_TYPE: Record<ServiceType, ServiceMeta> =
  Object.fromEntries(SERVICES.map((s) => [s.service, s])) as Record<
    ServiceType,
    ServiceMeta
  >;
