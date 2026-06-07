import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "invoices";
const QUOTES_BUCKET = "quotes";

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
