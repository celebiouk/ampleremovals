import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserType } from "@/lib/user-type";

/**
 * Refreshes the Supabase auth session on every request and enforces auth on
 * protected routes. Returns the (possibly redirected) response.
 *
 * - All `/admin/*` routes require admin session EXCEPT `/admin/login`
 * - All `/drivers/*` routes require driver session EXCEPT `/drivers/login`
 * - Drivers trying to access `/admin` are redirected to `/drivers/dashboard`
 * - Admins trying to access `/drivers` are redirected to `/admin`
 * - Public routes pass straight through
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isDriverRoute = pathname.startsWith("/drivers");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isDriverLoginRoute = pathname === "/drivers/login";
  const isDriverRegisterRoute = pathname === "/drivers/register";

  // ── Admin Routes ──────────────────────────────────────────

  // Unauthenticated user trying to reach a protected admin route → login
  if (isAdminRoute && !isAdminLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user on admin route (not login) → check if they're a driver
  if (isAdminRoute && !isAdminLoginRoute && user) {
    const userType = await getUserType(user.id);
    if (userType === "driver") {
      // Driver trying to access admin → redirect to driver dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/drivers/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated user hitting admin login → admin dashboard
  if (isAdminLoginRoute && user) {
    const userType = await getUserType(user.id);
    if (userType === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    // If driver on admin login, let them through (they'll see an error)
  }

  // ── Driver Routes ─────────────────────────────────────────

  // Unauthenticated user trying to reach a protected driver route → login
  // BUT allow /drivers/register (public registration page)
  if (isDriverRoute && !isDriverLoginRoute && !isDriverRegisterRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/drivers/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user on driver route (not login, not register) → check if they're an admin
  if (isDriverRoute && !isDriverLoginRoute && !isDriverRegisterRoute && user) {
    const userType = await getUserType(user.id);
    if (userType === "admin") {
      // Admin trying to access driver portal → redirect to admin dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated user hitting driver login → driver dashboard
  if (isDriverLoginRoute && user) {
    const userType = await getUserType(user.id);
    if (userType === "driver") {
      const url = request.nextUrl.clone();
      url.pathname = "/drivers/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    // If admin on driver login, let them through (they'll see an error)
  }

  return supabaseResponse;
}
