/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 * Uses DOMPurify to strip HTML tags and dangerous content.
 */

import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a DOMPurify instance for server-side use
const window = new JSDOM("").window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

/**
 * Sanitizes general text input by stripping HTML tags.
 * Use for: description, notes, comments, any long-form text.
 *
 * @param input - Raw user input
 * @returns Sanitized text, max 5000 characters
 */
export function sanitiseText(input: string): string {
  if (!input) return "";

  // Strip all HTML tags
  const cleaned = purify.sanitize(input, { ALLOWED_TAGS: [] });

  // Trim whitespace
  const trimmed = cleaned.trim();

  // Limit length
  return trimmed.substring(0, 5000);
}

/**
 * Sanitizes name fields (person names, company names).
 * Allows: letters, spaces, hyphens, apostrophes.
 * Use for: full_name, company_name.
 *
 * @param input - Raw name input
 * @returns Sanitized name, max 100 characters
 */
export function sanitiseName(input: string): string {
  if (!input) return "";

  // Strip HTML
  const cleaned = purify.sanitize(input, { ALLOWED_TAGS: [] });

  // Remove special characters except spaces, hyphens, apostrophes
  const filtered = cleaned.replace(/[^a-zA-Z0-9\s\-']/g, "");

  // Trim and limit
  return filtered.trim().substring(0, 100);
}

/**
 * Sanitizes phone number input.
 * Allows: digits, +, spaces, hyphens, parentheses.
 * Use for: phone numbers.
 *
 * @param input - Raw phone input
 * @returns Sanitized phone, max 20 characters
 */
export function sanitisePhone(input: string): string {
  if (!input) return "";

  // Strip HTML
  const cleaned = purify.sanitize(input, { ALLOWED_TAGS: [] });

  // Keep only: digits, +, spaces, hyphens, parentheses
  const filtered = cleaned.replace(/[^0-9+\s\-()]/g, "");

  // Trim and limit
  return filtered.trim().substring(0, 20);
}

/**
 * Sanitizes email addresses.
 * Basic validation and HTML stripping.
 * Use for: email addresses.
 *
 * @param input - Raw email input
 * @returns Sanitized email, max 255 characters
 */
export function sanitiseEmail(input: string): string {
  if (!input) return "";

  // Strip HTML
  const cleaned = purify.sanitize(input, { ALLOWED_TAGS: [] });

  // Trim and limit
  const trimmed = cleaned.trim().toLowerCase().substring(0, 255);

  // Basic email validation (simple check, not RFC-compliant)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "";
  }

  return trimmed;
}

/**
 * Sanitizes postcode input.
 * Allows: letters, numbers, spaces.
 * Use for: UK postcodes.
 *
 * @param input - Raw postcode input
 * @returns Sanitized postcode, uppercase, max 10 characters
 */
export function sanitisePostcode(input: string): string {
  if (!input) return "";

  // Strip HTML
  const cleaned = purify.sanitize(input, { ALLOWED_TAGS: [] });

  // Keep only alphanumeric and spaces
  const filtered = cleaned.replace(/[^a-zA-Z0-9\s]/g, "");

  // Uppercase and limit
  return filtered.trim().toUpperCase().substring(0, 10);
}
