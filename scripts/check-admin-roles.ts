/**
 * Quick script to check admin user roles
 * Run with: npx tsx scripts/check-admin-roles.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse .env.local manually
const envContent = readFileSync(".env.local", "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdminRoles() {
  console.log("🔍 Fetching all admin users...\n");

  const { data: adminUsers, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, supabase_user_id, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  if (!adminUsers || adminUsers.length === 0) {
    console.log("⚠️  No admin users found in database!");
    return;
  }

  console.log(`Found ${adminUsers.length} admin user(s):\n`);

  // Get emails from auth
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const users = usersData?.users || [];

  for (const admin of adminUsers) {
    const roleIcon = admin.role === "super_admin" ? "👑" : "👤";
    const status = admin.is_active ? "✅" : "❌";

    console.log(`${roleIcon} ${admin.email} ${status}`);
    console.log(`   Name: ${admin.full_name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.is_active}`);
    console.log(`   Supabase User ID: ${admin.supabase_user_id || "Not linked"}`);
    console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}`);
    console.log("");
  }

  // Check specifically for ampleremovals@gmail.com
  const targetAdmin = adminUsers.find((a) => a.email === "ampleremovals@gmail.com");
  console.log("🎯 Checking ampleremovals@gmail.com:");
  if (targetAdmin) {
    if (targetAdmin.role === "super_admin") {
      console.log("   ✅ YES - IS super_admin");
    } else {
      console.log(`   ❌ NO - Role is: ${targetAdmin.role}`);
      console.log("   💡 Need to update to super_admin");
    }
  } else {
    console.log("   ❌ NOT found in admin_users table");
  }
}

checkAdminRoles().then(() => process.exit(0));
