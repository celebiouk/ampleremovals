import crypto from "crypto";

/**
 * Generate a secure token for quote confirmation
 * Format: HMAC-SHA256 hash of bookingId + timestamp + secret
 */
export function generateQuoteConfirmToken(bookingId: string): string {
  const secret = process.env.QUOTE_CONFIRM_SECRET;
  if (!secret) {
    throw new Error("QUOTE_CONFIRM_SECRET environment variable is not set");
  }

  const timestamp = Date.now();
  const payload = `${bookingId}:${timestamp}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const hash = hmac.digest("hex");

  // Return token in format: timestamp.hash (allows validation with expiry)
  return `${timestamp}.${hash}`;
}

/**
 * Verify a quote confirmation token
 * Returns bookingId if valid, null if invalid or expired
 */
export function verifyQuoteConfirmToken(
  bookingId: string,
  token: string,
  expiryHours = 48
): boolean {
  const secret = process.env.QUOTE_CONFIRM_SECRET;
  if (!secret) {
    throw new Error("QUOTE_CONFIRM_SECRET environment variable is not set");
  }

  try {
    const [timestampStr, providedHash] = token.split(".");
    if (!timestampStr || !providedHash) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiry
    const now = Date.now();
    const expiryMs = expiryHours * 60 * 60 * 1000;
    if (now - timestamp > expiryMs) return false;

    // Regenerate hash and compare
    const payload = `${bookingId}:${timestamp}`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedHash = hmac.digest("hex");

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(providedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}
