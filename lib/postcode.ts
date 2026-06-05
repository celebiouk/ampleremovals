import type { PostcodeResult, AddressOption } from "@/types";

/**
 * getAddress.io response (basic tier — addresses as comma-separated strings).
 * e.g. "1 Rosedale Gardens, , , Thatcham, West Berkshire"
 */
interface GetAddressResponse {
  postcode?: string;
  latitude?: number;
  longitude?: number;
  addresses?: string[];
  Message?: string; // error message from API
}

/**
 * Parse a getAddress.io address string into an AddressOption.
 *
 * Format: "line1, line2, line3, town_or_city, county"
 * Empty segments are returned as empty strings by the API.
 */
function parseGetAddressLine(raw: string, postcode: string): AddressOption {
  const parts = raw.split(",").map((s) => s.trim());
  const line1 = parts[0] ?? "";
  // parts[1] and parts[2] are optional extra lines (usually empty)
  const line2 = [parts[1], parts[2]].filter(Boolean).join(", ") || undefined;
  const city = parts[3] || parts[4] || undefined;

  return { line_1: line1, line_2: line2, city, postcode };
}

/**
 * Look up individual UK property addresses for a postcode using getAddress.io.
 *
 * Returns every matching property (e.g. "1 Rosedale Gardens, Thatcham, RG19 3LE").
 * Falls back to a postcodes.io area-level result if no API key is configured.
 * Always resolves — invalid postcodes return an empty `addresses` array.
 */
export async function getAddressesByPostcode(
  postcode: string
): Promise<PostcodeResult> {
  const trimmed = postcode.trim();
  const normalised = trimmed.toUpperCase();
  if (!trimmed) return { postcode: normalised, addresses: [] };

  const apiKey = process.env.GETADDRESS_API_KEY;

  /* ── getAddress.io (full individual addresses) ─────────────────────── */
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.getaddress.io/find/${encodeURIComponent(trimmed)}?api-key=${apiKey}&sort=true`,
        { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
      );

      if (res.status === 404) return { postcode: normalised, addresses: [] };
      if (res.status === 401)
        throw new Error("getAddress.io API key invalid or expired");

      const data = (await res.json()) as GetAddressResponse;

      if (!data.addresses?.length) {
        return { postcode: normalised, addresses: [] };
      }

      const addresses = data.addresses.map((raw) =>
        parseGetAddressLine(raw, normalised)
      );

      return { postcode: normalised, addresses };
    } catch (err) {
      console.error("[postcode] getAddress.io error:", err);
      // Fall through to postcodes.io fallback
    }
  }

  /* ── postcodes.io fallback (area-level only — no API key needed) ───── */
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    );

    if (!res.ok) return { postcode: normalised, addresses: [] };

    const data = (await res.json()) as {
      status: number;
      result: {
        postcode: string;
        admin_district?: string | null;
        admin_ward?: string | null;
        region?: string | null;
        parliamentary_constituency?: string | null;
      } | null;
    };

    if (data.status !== 200 || !data.result)
      return { postcode: normalised, addresses: [] };

    const r = data.result;
    const city =
      r.admin_district ??
      r.parliamentary_constituency ??
      r.region ??
      undefined;

    return {
      postcode: r.postcode,
      addresses: [{ line_1: "", line_2: r.admin_ward ?? undefined, city, postcode: r.postcode }],
    };
  } catch {
    return { postcode: normalised, addresses: [] };
  }
}

/** Validate a UK postcode (postcodes.io — always free). */
export async function isValidPostcode(postcode: string): Promise<boolean> {
  const trimmed = postcode.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}/validate`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { result: boolean };
    return Boolean(data.result);
  } catch {
    return false;
  }
}
