/**
 * Test: POST /api/bookings/end-of-tenancy
 * Run: npx ts-node scripts/test-end-of-tenancy.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const payload = {
  originPostcode: "RG19 3LE",
  originAddress: { line_1: "10 Rosedale Gardens", city: "Thatcham", postcode: "RG19 3LE" },
  propertyType: "flat",
  bedrooms: "1",
  tenancyEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  addons: ["carpet_cleaning", "oven_cleaning"],
  accessInstructions: "Speak to the letting agent on arrival.",
  description: "End of tenancy clean for a 1-bed flat. Tenancy ends in 10 days.",
  isFlexibleDate: false,
  fullName: "Test User",
  email: "test@example.com",
  phone: "07700900004",
};

async function run() {
  console.log("Testing POST /api/bookings/end-of-tenancy...\n");
  const res = await fetch(`${BASE}/api/bookings/end-of-tenancy`, {
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
