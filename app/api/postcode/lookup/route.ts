import { NextResponse, type NextRequest } from "next/server";
import { getAddressesByPostcode } from "@/lib/postcode";

/**
 * GET /api/postcode/lookup?postcode=SW1A1AA
 * Returns a PostcodeResult. Always 200 on a valid request shape; an unknown
 * postcode resolves with an empty `addresses` array.
 */
export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode")?.trim();

  if (!postcode) {
    return NextResponse.json(
      { error: "Missing 'postcode' query parameter." },
      { status: 400 }
    );
  }

  const result = await getAddressesByPostcode(postcode);
  return NextResponse.json(result);
}
