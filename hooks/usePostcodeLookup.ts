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

interface AutocompleteSuggestion {
  address: string;
  url: string;
  id: string;
}

interface AutocompleteResponse {
  suggestions?: AutocompleteSuggestion[];
  Message?: string;
}

function parseAutocompleteSuggestion(suggestion: AutocompleteSuggestion, postcode: string): AddressOption {
  const parts = suggestion.address.split(",").map((s) => s.trim()).filter(Boolean);
  const line1 = parts[0] ?? "";
  const line2 = parts.length > 2 ? parts[1] : undefined;
  const city = parts[parts.length - 2] || parts[parts.length - 1] || undefined;
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

    // Domain token (dtoken_...) for safe browser-side calls — set NEXT_PUBLIC_GETADDRESS_DOMAIN_TOKEN
    const domainToken = process.env.NEXT_PUBLIC_GETADDRESS_DOMAIN_TOKEN;

    /* ── Direct browser call to getAddress.io autocomplete ── */
    if (domainToken) {
      try {
        const res = await fetch(
          `https://api.getaddress.io/autocomplete/${encodeURIComponent(postcode.trim())}?api-key=${domainToken}&all=true`,
          { headers: { Accept: "application/json" } }
        );

        if (res.ok) {
          const data = (await res.json()) as AutocompleteResponse;
          if (data.suggestions?.length) {
            const normalised = postcode.trim().toUpperCase();
            const parsed = data.suggestions.map((s) =>
              parseAutocompleteSuggestion(s, normalised)
            );
            cache.current.set(key, parsed);
            setAddresses(parsed);
            setLoading(false);
            return parsed;
          }
        }
      } catch {
        // fall through to server proxy
      }
    }

    /* ── Server proxy fallback (postcodes.io area-level) ── */
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
