/**
 * Test: POST /api/bookings/house-clearance
 * Run: npx ts-node scripts/test-house-clearance.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const payload = {
  clearanceType: "full",
  originPostcode: "RG19 3LE",
  originAddress: { line_1: "14 Rosedale Gardens", city: "Thatcham", postcode: "RG19 3LE" },
  propertyType: "house",
  bedrooms: "4",
  itemsOfNote: ["piano", "large fridge-freezer", "old sofa"],
  description: "Full clearance of a 4-bed house. Contents include old furniture and white goods.",
  isFlexibleDate: true,
  flexibleDateFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  flexibleDateTo: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
  fullName: "Test User",
  email: "test@example.com",
  phone: "07700900002",
};

async function run() {
  console.log("Testing POST /api/bookings/house-clearance...\n");
  const res = await fetch(`${BASE}/api/bookings/house-clearance`, {
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
