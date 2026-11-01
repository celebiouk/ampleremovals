import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import type { ComponentType } from "react";

/**
 * Maps a brand slug to its logo component — needed by any page that
 * renders a brand's chrome generically at runtime (resolved from the
 * Host header) rather than importing a specific brand's logo at compile
 * time, like the shared booking journey's layout does. Ample has no
 * entry here deliberately — its own flow keeps using the existing
 * <Navbar /> component, which has its own logo built in.
 *
 * Adding a new brand: add its logo component here too, alongside the
 * entry in lib/brands.ts.
 */
export const BRAND_LOGO_BY_SLUG: Record<string, ComponentType<{ className?: string; variant?: "color" | "white" }>> = {
  "thatcham-movers": ThatchamMoversLogo,
  "newbury-removals": NewburyRemovalsLogo,
  manyvans: ManyVansLogo,
};
