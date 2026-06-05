import type { PostcodeResult, AddressOption } from "@/types";

/**
 * postcodes.io response shape (subset we use).
 */
interface PostcodesIoResult {
  postcode: string;
  admin_district: string | null;
  admin_ward: string | null;
  parish: string | null;
  region: string | null;
  country: string | null;
  parliamentary_constituency: string | null;
}

interface PostcodesIoResponse {
  status: number;
  result: PostcodesIoResult | null;
  error?: string;
}

/**
 * Look up a UK postcode via the free postcodes.io API.
 *
 * postcodes.io validates the postcode and returns geographic metadata but
 * NOT full address (house-level) data, so we return a single normalised
 * area-level option. The booking UI lets users complete line_1 manually.
 *
 * Always resolves; invalid postcodes return an empty `addresses` array.
 */
export async function getAddressesByPostcode(
  postcode: string
): Promise<PostcodeResult> {
  const trimmed = postcode.trim();
  const normalised = trimmed.toUpperCase();

  if (!trimmed) {
    return { postcode: normalised, addresses: [] };
  }

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    );

    if (!res.ok) {
      // 404 = invalid/unknown postcode — handled gracefully.
      return { postcode: normalised, addresses: [] };
    }

    const data = (await res.json()) as PostcodesIoResponse;
    if (data.status !== 200 || !data.result) {
      return { postcode: normalised, addresses: [] };
    }

    const r = data.result;
    const city =
      r.admin_district ?? r.parliamentary_constituency ?? r.region ?? undefined;

    const addresses: AddressOption[] = [
      {
        line_1: "",
        line_2: r.admin_ward ?? undefined,
        city,
        postcode: r.postcode,
      },
    ];

    return { postcode: r.postcode, addresses };
  } catch {
    // Network / parse error — fail gracefully.
    return { postcode: normalised, addresses: [] };
  }
}

/** Quick client/server-side validation of a UK postcode via postcodes.io. */
export async function isValidPostcode(postcode: string): Promise<boolean> {
  const trimmed = postcode.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(
        trimmed
      )}/validate`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { result: boolean };
    return Boolean(data.result);
  } catch {
    return false;
  }
}
