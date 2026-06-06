import type { PostcodeResult, AddressOption } from "@/types";

interface IdealPostcodesAddress {
  line_1: string;
  line_2: string;
  line_3: string;
  post_town: string;
  county: string;
  postcode: string;
}

interface IdealPostcodesResponse {
  code: number;
  message: string;
  result?: IdealPostcodesAddress[];
}

/**
 * Look up individual UK property addresses for a postcode via Ideal Postcodes.
 * Falls back to postcodes.io area-level result if no API key is configured.
 */
export async function getAddressesByPostcode(
  postcode: string
): Promise<PostcodeResult> {
  const trimmed = postcode.trim();
  const normalised = trimmed.toUpperCase();
  if (!trimmed) return { postcode: normalised, addresses: [] };

  const apiKey = process.env.IDEAL_POSTCODES_API_KEY;

  /* ── Ideal Postcodes (full individual addresses) ───────────────────── */
  if (apiKey) {
    try {
      const slug = normalised.replace(/\s+/g, "");
      const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(slug)}?api_key=${apiKey}`,
        { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
      );

      if (!res.ok) throw new Error(`Ideal Postcodes responded ${res.status}`);

      const data = (await res.json()) as IdealPostcodesResponse;

      if (data.code !== 2000 || !data.result?.length)
        throw new Error("Ideal Postcodes: no results");

      const addresses: AddressOption[] = data.result.map((a) => ({
        line_1: a.line_1,
        line_2: [a.line_2, a.line_3].filter(Boolean).join(", ") || undefined,
        city: a.post_town || a.county || undefined,
        postcode: a.postcode,
      }));

      return { postcode: normalised, addresses };
    } catch (err) {
      console.error("[postcode] Ideal Postcodes error:", err);
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
      } | null;
    };

    if (data.status !== 200 || !data.result)
      return { postcode: normalised, addresses: [] };

    const r = data.result;
    return {
      postcode: r.postcode,
      addresses: [{ line_1: "", line_2: r.admin_ward ?? undefined, city: r.admin_district ?? undefined, postcode: r.postcode }],
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
