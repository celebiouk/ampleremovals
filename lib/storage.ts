import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "invoices";
const QUOTES_BUCKET = "quotes";
const DOCUMENTS_BUCKET = "booking-documents";

/**
 * Uploads an invoice PDF buffer to Supabase Storage.
 * Path: invoices/[bookingId]/[invoiceId].pdf
 * Returns the storage path.
 */
export async function uploadInvoicePDF(
  bookingId: string,
  invoiceId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${bookingId}/${invoiceId}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload PDF: ${error.message}`);
  return path;
}

/**
 * Generates a signed URL for a stored invoice PDF.
 * Default expiry: 7 days (604800 seconds).
 */
export async function getInvoiceSignedURL(
  bookingId: string,
  invoiceId: string,
  expiresInSeconds = 604800
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${bookingId}/${invoiceId}.pdf`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl)
    throw new Error(`Failed to generate signed URL: ${error?.message ?? "Unknown error"}`);

  return data.signedUrl;
}

/**
 * Uploads a quote PDF buffer to Supabase Storage.
 * Path: quotes/[bookingId]/[bookingReference].pdf
 * Returns the storage path.
 */
export async function uploadQuotePDF(
  bookingId: string,
  bookingReference: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${bookingId}/${bookingReference}.pdf`;

  const { error } = await supabase.storage
    .from(QUOTES_BUCKET)
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload quote PDF: ${error.message}`);
  return path;
}

/**
 * Generates a signed URL for a stored quote PDF.
 * Default expiry: 30 days (2592000 seconds).
 */
export async function getQuoteSignedURL(
  bookingId: string,
  bookingReference: string,
  expiresInSeconds = 2592000
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${bookingId}/${bookingReference}.pdf`;

  const { data, error } = await supabase.storage
    .from(QUOTES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl)
    throw new Error(`Failed to generate quote signed URL: ${error?.message ?? "Unknown error"}`);

  return data.signedUrl;
}

/**
 * Downloads an invoice PDF as a Buffer (for email attachments).
 */
export async function downloadInvoicePDF(
  bookingId: string,
  invoiceId: string
): Promise<Buffer> {
  const supabase = createAdminClient();
  const path = `${bookingId}/${invoiceId}.pdf`;

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Failed to download PDF: ${error?.message ?? "Unknown error"}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ──────────────────────────────────────────────────────────
// BOOKING DOCUMENTS (photos, permits, agreements, etc.)
// ──────────────────────────────────────────────────────────

/**
 * Sanitizes a filename by removing special characters and limiting length.
 * Converts spaces to underscores, removes non-alphanumeric chars except: - _ .
 */
function sanitizeFileName(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));

  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 100);

  return sanitized + ext;
}

/**
 * Uploads a booking document to Supabase Storage.
 * Path: booking-documents/[bookingId]/[timestamp]_[sanitizedFileName]
 * Returns: { path, fileName, fileSize }
 */
export async function uploadBookingDocument(
  bookingId: string,
  file: File
): Promise<{ path: string; fileName: string; fileSize: number }> {
  const supabase = createAdminClient();

  const sanitizedName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const path = `${bookingId}/${timestamp}_${sanitizedName}`;

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  return {
    path,
    fileName: sanitizedName,
    fileSize: file.size,
  };
}

/**
 * Generates a signed URL for a booking document.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getBookingDocumentSignedURL(
  filePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a booking document from Supabase Storage.
 */
export async function deleteBookingDocument(filePath: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
