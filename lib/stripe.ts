import Stripe from "stripe";

/**
 * Stripe server client. The API version is pinned per spec; it is cast
 * because the installed SDK's type only allows its own default literal.
 */
type StripeConfig = NonNullable<ConstructorParameters<typeof Stripe>[1]>;

// Pinned per spec; cast because the SDK's type only permits its own default
// literal for `apiVersion`.
const apiVersion = "2024-04-10" as StripeConfig["apiVersion"];

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion,
  typescript: true,
  appInfo: { name: "Ample Removals" },
});

/** Test-mode client (sk_test_…). Present only when the test key is set. Lets us
 *  run the full card flow with test cards without touching live money. */
export const stripeTest = process.env.STRIPE_SECRET_KEY_TEST
  ? new Stripe(process.env.STRIPE_SECRET_KEY_TEST, { apiVersion, typescript: true, appInfo: { name: "Ample Removals (test)" } })
  : null;
