import { headers } from "next/headers";
import { BRAND_BY_SLUG, AMPLE_BRAND, type Brand } from "@/lib/brands";

/** Read the brand resolved by middleware.ts for the current request (server
 *  components/route handlers only). */
export async function getCurrentBrand(): Promise<Brand> {
  const h = await headers();
  const slug = h.get("x-brand");
  return (slug && BRAND_BY_SLUG[slug]) || AMPLE_BRAND;
}
