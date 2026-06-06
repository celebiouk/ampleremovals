/**
 * Test: POST /api/bookings/removals
 * Run: npx ts-node scripts/test-removals.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const payload = {
  removalType: "domestic",
  originPostcode: "RG19 3LE",
  originAddress: { line_1: "12 Rosedale Gardens", city: "Thatcham", postcode: "RG19 3LE" },
  propertyType: "house",
  bedrooms: "3",
  destinationPostcode: "SW1A 1AA",
  destinationAddress: { line_1: "1 Parliament Square", city: "London", postcode: "SW1A 1AA" },
  additionalServices: {
    packingServices: true,
    packingMaterials: false,
    disassembleFurniture: false,
    assembleFurniture: false,
  },
  description: "Moving a 3-bedroom house. Have a piano and large wardrobe that need extra care.",
  isFlexibleDate: false,
  moveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  fullName: "Test User",
  email: "test@example.com",
  phone: "07700900000",
};

async function run() {
  console.log("Testing POST /api/bookings/removals...\n");
  const res = await fetch(`${BASE}/api/bookings/removals`, {
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
