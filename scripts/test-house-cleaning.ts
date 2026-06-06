/**
 * Test: POST /api/bookings/house-cleaning
 * Run: npx ts-node scripts/test-house-cleaning.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const payload = {
  cleaningType: "deep",
  frequency: "one_off",
  originPostcode: "RG19 3LE",
  originAddress: { line_1: "6 Loundyes Close", city: "Thatcham", postcode: "RG19 3LE" },
  propertyType: "flat",
  bedrooms: "2",
  moveDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  timeSlot: "morning",
  accessInstructions: "Key under the mat.",
  description: "Deep clean of a 2-bed flat before moving in. Focus on kitchen and bathrooms.",
  isFlexibleDate: false,
  fullName: "Test User",
  email: "test@example.com",
  phone: "07700900003",
};

async function run() {
  console.log("Testing POST /api/bookings/house-cleaning...\n");
  const res = await fetch(`${BASE}/api/bookings/house-cleaning`, {
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
