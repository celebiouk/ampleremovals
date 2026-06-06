"use client";

import { useState, useCallback, useRef } from "react";
import type { AddressOption } from "@/types";

interface UsePostcodeLookupReturn {
  loading: boolean;
  error: string | null;
  addresses: AddressOption[];
  lookup: (postcode: string) => Promise<AddressOption[] | null>;
  reset: () => void;
}

interface GetAddressResponse {
  addresses?: string[];
  Message?: string;
}

function parseGetAddressLine(raw: string, postcode: string): AddressOption {
  const parts = raw.split(",").map((s) => s.trim());
  const line1 = parts[0] ?? "";
  const line2 = [parts[1], parts[2]].filter(Boolean).join(", ") || undefined;
  const city = parts[3] || parts[4] || undefined;
  return { line_1: line1, line_2: line2, city, postcode };
}

export function usePostcodeLookup(): UsePostcodeLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const cache = useRef<Map<string, AddressOption[]>>(new Map());

  const lookup = useCallback(async (postcode: string) => {
    const key = postcode.trim().toUpperCase().replace(/\s+/g, "");
    if (!key) {
      setError("Please enter a postcode");
      return null;
    }

    if (cache.current.has(key)) {
      const cached = cache.current.get(key)!;
      setAddresses(cached);
      setError(cached.length ? null : "We couldn't find that postcode. Please check and try again.");
      return cached.length ? cached : null;
    }

    setLoading(true);
    setError(null);

    const apiKey = process.env.NEXT_PUBLIC_GETADDRESS_API_KEY;

    /* ── Direct browser call to getAddress.io ── */
    if (apiKey) {
      try {
        const res = await fetch(
          `https://api.getaddress.io/find/${encodeURIComponent(postcode.trim())}?api-key=${apiKey}&sort=true`,
          { headers: { Accept: "application/json" } }
        );

        if (res.ok) {
          const data = (await res.json()) as GetAddressResponse;
          if (data.addresses?.length) {
            const normalised = postcode.trim().toUpperCase();
            const parsed = data.addresses.map((raw) =>
              parseGetAddressLine(raw, normalised)
            );
            cache.current.set(key, parsed);
            setAddresses(parsed);
            setLoading(false);
            return parsed;
          }
        }
        // Non-OK or empty — fall through to proxy
      } catch {
        // Network error — fall through to proxy
      }
    }

    /* ── Server proxy fallback (postcodes.io) ── */
    try {
      const res = await fetch(
        `/api/postcode/lookup?postcode=${encodeURIComponent(postcode.trim())}`
      );
      const data = (await res.json()) as { postcode: string; addresses: AddressOption[] };

      if (!res.ok || !data.addresses?.length) {
        setAddresses([]);
        setError("We couldn't find that postcode. Please check and try again.");
        setLoading(false);
        return null;
      }

      cache.current.set(key, data.addresses);
      setAddresses(data.addresses);
      setLoading(false);
      return data.addresses;
    } catch {
      setError("Something went wrong looking up that postcode.");
      setAddresses([]);
      setLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setAddresses([]);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, addresses, lookup, reset };
}
