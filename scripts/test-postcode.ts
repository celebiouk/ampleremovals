/**
 * Test: GET /api/postcode/lookup
 * Run: npx ts-node scripts/test-postcode.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function run() {
  console.log("Testing postcode lookup...\n");

  const tests = [
    { postcode: "RG19 3LE", expectAddresses: true },
    { postcode: "SW1A 1AA", expectAddresses: true },
    { postcode: "INVALID", expectAddresses: false },
  ];

  for (const t of tests) {
    const res = await fetch(`${BASE}/api/postcode/lookup?postcode=${encodeURIComponent(t.postcode)}`);
    const data = await res.json() as { addresses?: unknown[]; postcode?: string };

    const hasAddresses = Array.isArray(data.addresses) && data.addresses.length > 0;
    const pass = hasAddresses === t.expectAddresses;

    console.log(`${pass ? "✅ PASS" : "❌ FAIL"} — ${t.postcode}`);
    if (pass && hasAddresses) {
      console.log(`   ${data.addresses!.length} addresses returned, postcode: ${data.postcode}`);
    }
    if (!pass) {
      console.log("   Response:", JSON.stringify(data));
    }
  }
}

run().catch(console.error);
