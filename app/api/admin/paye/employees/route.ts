/**
 * GET  /api/admin/paye/employees — list employees
 * POST /api/admin/paye/employees — create an employee
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const EmployeeSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  ni_number: z.string().optional().nullable(),
  tax_code: z.string().min(1).default("1257L"),
  tax_basis: z.enum(["cumulative", "week1month1"]).default("cumulative"),
  ni_category: z.string().default("A"),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  is_director: z.boolean().optional(),
  pay_basis: z.enum(["salary", "hourly"]).default("salary"),
  annual_salary: z.number().finite().nonnegative().optional(),
  hourly_rate: z.number().finite().nonnegative().optional(),
  student_loan_plan: z.enum(["none", "plan1", "plan2", "plan4", "plan5"]).default("none"),
  postgrad_loan: z.boolean().optional(),
  bank_sort_code: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("status")
      .order("first_name");
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, employees: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const input = EmployeeSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .insert({
        ...input,
        ni_number: input.ni_number || null,
        date_of_birth: input.date_of_birth || null,
        start_date: input.start_date || null,
        annual_salary: input.annual_salary ?? 0,
        hourly_rate: input.hourly_rate ?? 0,
        is_director: input.is_director ?? false,
        postgrad_loan: input.postgrad_loan ?? false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: `Employee added: ${input.first_name} ${input.last_name}`,
      metadata: { employee_id: data?.id },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid input", issues: e.issues }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
