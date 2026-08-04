/**
 * Super-admin gating. The source of truth is the `super_admin` role in
 * admin_users, so promoting someone there (or via Manage Admins) grants them the
 * full set of powers — including the ones historically hardcoded to one email.
 *
 * SUPER_ADMIN_EMAILS is a belt-and-suspenders fallback for the core owner
 * accounts, used when a role lookup isn't available (e.g. a client component that
 * only knows the email). Keep it in sync with the admin_users roles.
 */
export const SUPER_ADMIN_EMAILS = [
  "ampleremovals@gmail.com",
  "rita@ampleremovals.com",
];

/** True if this user is a super admin — by role (preferred) or a known email. */
export function isSuperAdmin(email?: string | null, role?: string | null): boolean {
  if (role === "super_admin") return true;
  return !!email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
