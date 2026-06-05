"use client";

import { useState, useCallback } from "react";
import type { PostcodeResult, AddressOption } from "@/types";

interface UsePostcodeLookupReturn {
  loading: boolean;
  error: string | null;
  result: PostcodeResult | null;
  addresses: AddressOption[];
  lookup: (postcode: string) => Promise<PostcodeResult | null>;
  reset: () => void;
}

/**
 * Client hook to look up a UK postcode via /api/postcode/lookup.
 */
export function usePostcodeLookup(): UsePostcodeLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostcodeResult | null>(null);

  const lookup = useCallback(async (postcode: string) => {
    const trimmed = postcode.trim();
    if (!trimmed) {
      setError("Please enter a postcode");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/postcode/lookup?postcode=${encodeURIComponent(trimmed)}`
      );
      const data = (await res.json()) as PostcodeResult;

      if (!res.ok || data.addresses.length === 0) {
        setResult(null);
        setError("We couldn't find that postcode. Please check and try again.");
        return null;
      }

      setResult(data);
      return data;
    } catch {
      setError("Something went wrong looking up that postcode.");
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    result,
    addresses: result?.addresses ?? [],
    lookup,
    reset,
  };
}
