/**
 * Apply supabase/migrations/setup_pg_cron.sql against the live database.
 * Usage: npx ts-node scripts/apply-pg-cron.ts
 * Requires DATABASE_URL (see scripts/run-migrations.ts for format).
 *
 * The file is idempotent (unschedule-if-exists, then reschedule), so re-running
 * it after any edit — like removing a job — is the correct way to apply the change.
 */
import { readFileSync } from "fs";
import { Client } from "pg";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌  DATABASE_URL is not set.");
  process.exit(1);
}

async function run() {
  const sql = readFileSync("supabase/migrations/setup_pg_cron.sql", "utf8");
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅ Connected to database\n");
  try {
    await client.query(sql);
    console.log("✅ setup_pg_cron.sql applied");
  } catch (e) {
    console.error("❌ Failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
