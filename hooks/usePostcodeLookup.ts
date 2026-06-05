"use client";

import { useState, useCallback, useRef } from "react";
import type { PostcodeResult, AddressOption } from "@/types";

interface UsePostcodeLookupReturn {
  loading: boolean;
  error: string | null;
  addresses: AddressOption[];
  lookup: (postcode: string) => Promise<AddressOption[] | null>;
  reset: () => void;
}

/**
 * Looks up a UK postcode via /api/postcode/lookup. Fires only on explicit
 * call (no debounce) and caches results per normalised postcode to avoid
 * duplicate network calls.
 */
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
      setError(cached.length ? null : "We couldn't find that postcode.");
      return cached;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/postcode/lookup?postcode=${encodeURIComponent(postcode.trim())}`
      );
      const data = (await res.json()) as PostcodeResult;

      if (!res.ok || !data.addresses?.length) {
        setAddresses([]);
        setError("We couldn't find that postcode. Please check and try again.");
        return null;
      }

      cache.current.set(key, data.addresses);
      setAddresses(data.addresses);
      return data.addresses;
    } catch {
      setError("Something went wrong looking up that postcode.");
      setAddresses([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAddresses([]);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, addresses, lookup, reset };
}
