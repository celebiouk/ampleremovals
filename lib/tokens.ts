import crypto from "crypto";

/**
 * Generate a secure token for quote confirmation
 * Format: HMAC-SHA256 hash of bookingId + timestamp + secret
 * Returns null if QUOTE_CONFIRM_SECRET is not set (feature disabled)
 */
export function generateQuoteConfirmToken(bookingId: string): string | null {
  const secret = process.env.QUOTE_CONFIRM_SECRET;
  if (!secret) {
    console.warn("⚠️ QUOTE_CONFIRM_SECRET not set - quote confirmation disabled");
    return null;
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
 * Returns true if valid, false if invalid/expired/secret missing
 */
export function verifyQuoteConfirmToken(
  bookingId: string,
  token: string,
  expiryHours = 48
): boolean {
  const secret = process.env.QUOTE_CONFIRM_SECRET;
  if (!secret) {
    console.warn("⚠️ QUOTE_CONFIRM_SECRET not set - cannot verify token, returning false");
    return false;
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

/** Signing secret for driver-assignment links (falls back to CRON_SECRET so it
 *  always works without extra config). */
function assignmentSecret(): string {
  return process.env.QUOTE_CONFIRM_SECRET || process.env.CRON_SECRET || "ample-assignment";
}

/** Token for a driver to accept/decline a specific job assignment (no login). */
export function generateAssignmentToken(bookingId: string, driverId: string): string {
  const timestamp = Date.now();
  const payload = `assign:${bookingId}:${driverId}:${timestamp}`;
  const hash = crypto.createHmac("sha256", assignmentSecret()).update(payload).digest("hex");
  return `${timestamp}.${hash}`;
}

export function verifyAssignmentToken(
  bookingId: string,
  driverId: string,
  token: string,
  expiryDays = 30
): boolean {
  try {
    const [timestampStr, providedHash] = token.split(".");
    if (!timestampStr || !providedHash) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (Date.now() - timestamp > expiryDays * 24 * 60 * 60 * 1000) return false;

    const payload = `assign:${bookingId}:${driverId}:${timestamp}`;
    const expectedHash = crypto.createHmac("sha256", assignmentSecret()).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(providedHash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}
