import type { PostcodeResult, AddressOption } from "@/types";

interface AutocompleteSuggestion {
  address: string;
  url: string;
  id: string;
}

interface AutocompleteResponse {
  suggestions?: AutocompleteSuggestion[];
  Message?: string;
}

/** Parse an autocomplete address string into an AddressOption.
 *  Format: "1 Rosedale Gardens, Thatcham, West Berkshire"
 */
function parseAutocompleteSuggestion(suggestion: AutocompleteSuggestion, postcode: string): AddressOption {
  const parts = suggestion.address.split(",").map((s) => s.trim()).filter(Boolean);
  const line1 = parts[0] ?? "";
  const line2 = parts.length > 2 ? parts[1] : undefined;
  const city = parts[parts.length - 2] || parts[parts.length - 1] || undefined;
  return { line_1: line1, line_2: line2, city, postcode };
}

/**
 * Look up individual UK property addresses for a postcode using getAddress.io
 * autocomplete API (current v2+ endpoint).
 * Falls back to postcodes.io area-level result if no API key is configured.
 */
export async function getAddressesByPostcode(
  postcode: string
): Promise<PostcodeResult> {
  const trimmed = postcode.trim();
  const normalised = trimmed.toUpperCase();
  if (!trimmed) return { postcode: normalised, addresses: [] };

  const apiKey = process.env.GETADDRESS_API_KEY;

  /* ── getAddress.io autocomplete (server-side with API key) ─────────── */
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.getaddress.io/autocomplete/${encodeURIComponent(trimmed)}?api-key=${apiKey}&all=true`,
        { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
      );

      if (!res.ok) throw new Error(`getAddress.io responded ${res.status}`);

      const data = (await res.json()) as AutocompleteResponse;

      if (!data.suggestions?.length) throw new Error("getAddress.io: no suggestions");

      const addresses = data.suggestions.map((s) =>
        parseAutocompleteSuggestion(s, normalised)
      );

      return { postcode: normalised, addresses };
    } catch (err) {
      console.error("[postcode] getAddress.io error:", err);
    }
  }

  /* ── postcodes.io fallback (area-level only) ───────────────────────── */
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
    const city = r.admin_district ?? r.parliamentary_constituency ?? r.region ?? undefined;

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
