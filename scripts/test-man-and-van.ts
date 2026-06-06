/**
 * Test: POST /api/bookings/man-and-van
 * Run: npx ts-node scripts/test-man-and-van.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const payload = {
  vanType: "medium",
  originPostcode: "RG19 3LE",
  originAddress: { line_1: "8 Loundyes Close", city: "Thatcham", postcode: "RG19 3LE" },
  propertyType: "flat",
  bedrooms: "1",
  destinationPostcode: "RG14 1AA",
  destinationAddress: { line_1: "5 Market Place", city: "Newbury", postcode: "RG14 1AA" },
  additionalServices: {
    packingServices: false,
    packingMaterials: false,
    disassembleFurniture: false,
    assembleFurniture: false,
  },
  description: "Moving a 1-bed flat. Just furniture and boxes, nothing fragile.",
  isFlexibleDate: false,
  moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  fullName: "Test User",
  email: "test@example.com",
  phone: "07700900001",
};

async function run() {
  console.log("Testing POST /api/bookings/man-and-van...\n");
  const res = await fetch(`${BASE}/api/bookings/man-and-van`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as { success: boolean; reference?: string; bookingId?: string; error?: string };
  const pass = data.success === true && typeof data.reference === "string";

  console.log(pass ? "✅ PASS" : "❌ FAIL");
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
