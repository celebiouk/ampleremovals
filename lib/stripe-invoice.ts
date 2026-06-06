import { stripe } from "@/lib/stripe";

interface CreatePaymentLinkParams {
  invoiceId: string;
  invoiceNumber: string;
  amount: number; // in pence
  customerName: string;
  customerEmail: string;
  description: string;
  bookingReference: string;
  metadata: Record<string, string>;
}

interface PaymentLinkResult {
  paymentLink: string;
  paymentLinkId: string;
  priceId: string;
  productId: string;
}

/**
 * Creates a Stripe Product, Price, and Payment Link for an invoice.
 * Returns the payment link URL and related IDs.
 */
export async function createStripePaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  const { invoiceId, invoiceNumber, amount, description, bookingReference, metadata } = params;

  // 1. Create product
  const product = await stripe.products.create({
    name: description,
    metadata: {
      booking_id: metadata.bookingId ?? "",
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
    },
  });

  // 2. Create price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: "gbp",
  });

  // 3. Create payment link
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      booking_reference: bookingReference,
      ...(metadata.bookingId ? { booking_id: metadata.bookingId } : {}),
      ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
    },
    after_completion: {
      type: "redirect",
      redirect: { url: `${siteUrl}/payment-success?invoice=${invoiceId}` },
    },
    customer_creation: "always",
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
  });

  return {
    paymentLink: paymentLink.url,
    paymentLinkId: paymentLink.id,
    priceId: price.id,
    productId: product.id,
  };
}

/**
 * Deactivates a Stripe Payment Link so it can no longer be used.
 * paymentLinkId is extracted from the URL last segment.
 */
export async function voidStripePaymentLink(paymentLinkUrl: string): Promise<void> {
  // Extract ID from URL e.g. https://buy.stripe.com/plink_xxxxxx
  const parts = paymentLinkUrl.split("/");
  const paymentLinkId = parts[parts.length - 1];
  if (!paymentLinkId) return;

  try {
    await stripe.paymentLinks.update(paymentLinkId, { active: false });
  } catch {
    // Link may not be a standard payment link URL — try direct ID
    try {
      await stripe.paymentLinks.update(paymentLinkUrl, { active: false });
    } catch {
      // Best effort
    }
  }
}
