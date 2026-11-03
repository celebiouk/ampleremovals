import { manyVansTheme } from "@/components/local/multibrand/themes/manyvans/theme";
import type { BrandTheme } from "@/components/local/multibrand/themes/types";

/** Brand slug → its visual identity. A brand with no entry falls back to the
 *  original shared template. */
const THEMES: Record<string, BrandTheme> = {
  manyvans: manyVansTheme,
};

export function getBrandTheme(slug: string): BrandTheme | undefined {
  return THEMES[slug];
}
