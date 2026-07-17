/**
 * Deposit + bank-transfer config. The deposit is a percentage of the quote total,
 * paid by manual bank transfer to the account below (shown on the deposit screen).
 * Values come from NEXT_PUBLIC_* env so they render on the client without a
 * round-trip and are trivial to change without a deploy.
 */

export const DEPOSIT_PERCENTAGE = Number(process.env.NEXT_PUBLIC_DEPOSIT_PERCENTAGE ?? 25);

/** Deposit due for a given quote total, rounded to the penny. */
export function depositFor(total: number): number {
  const n = Number(total) || 0;
  return Math.round(n * (DEPOSIT_PERCENTAGE / 100) * 100) / 100;
}

export const BANK_DETAILS = {
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "",
  sortCode: process.env.NEXT_PUBLIC_BANK_SORT_CODE ?? "",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "",
};

/** True once real bank details are configured (so the UI can degrade gracefully). */
export const BANK_DETAILS_CONFIGURED = Boolean(
  BANK_DETAILS.accountName && BANK_DETAILS.sortCode && BANK_DETAILS.accountNumber
);
