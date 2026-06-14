"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCheck, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Payslip {
  id: string; employee_name: string; is_director: boolean;
  gross_pay: number; income_tax: number; employee_ni: number; employer_ni: number;
  student_loan: number; net_pay: number; tax_code_used: string; status: string;
}
interface Run { id: string; reference: string; tax_year: string; period_no: number; pay_date: string; status: string; payslips: Payslip[]; }
interface Totals { gross: number; tax: number; ee_ni: number; er_ni: number; student_loan: number; net: number; employer_cost: number; }

export default function PayeRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const [run, setRun] = useState<Run | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/paye/pay-runs/${runId}`);
      const data = await res.json();
      if (data.success) { setRun(data.run); setTotals(data.totals); }
      else { toast.error("Failed to load run"); router.push("/admin/paye"); }
    } catch { toast.error("Failed to load run"); }
    finally { setLoading(false); }
  }, [runId, router]);

  useEffect(() => { load(); }, [load]);

  async function payAll() {
    if (!window.confirm("Mark this whole run as paid?")) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/paye/pay-runs/${runId}/pay`, { method: "PATCH" });
      if ((await res.json()).success) { toast.success("Run marked paid"); load(); }
    } catch { toast.error("Failed"); }
    finally { setPaying(false); }
  }

  if (loading || !run || !totals) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.push("/admin/paye")} className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-700"><ArrowLeft className="h-4 w-4" /> Back to pay runs</button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{run.reference}</h1>
            <p className="mt-1 text-slate-600">Week {run.period_no} · {run.tax_year} · paid {new Date(run.pay_date).toLocaleDateString("en-GB")}</p>
          </div>
          <a href={`/api/admin/paye/pay-runs/${runId}/rti`} className="mr-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> RTI figures (CSV)
          </a>
          <button onClick={payAll} disabled={paying || run.status === "paid"} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            <CheckCheck className="h-4 w-4" /> {run.status === "paid" ? "Paid" : "Mark paid"}
          </button>
        </div>

        {/* Totals */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Stat label="Gross" value={totals.gross} />
          <Stat label="Income tax" value={totals.tax} />
          <Stat label="Employee NI" value={totals.ee_ni} />
          <Stat label="Employer NI" value={totals.er_ni} />
          <Stat label="Net pay" value={totals.net} accent />
          <Stat label="Total cost" value={totals.employer_cost} />
        </div>

        <div className="mb-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          Submit these figures to HMRC as your FPS via Basic PAYE Tools on/before the pay date. Download the RTI figures above.
        </div>

        {/* Payslips */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-900">
              <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-right">Gross</th><th className="px-4 py-3 text-right">Tax</th>
              <th className="px-4 py-3 text-right">EE NI</th><th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {run.payslips.map((p) => (
                <tr key={p.id} className="text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.employee_name}{p.is_director && <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">dir</span>}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{p.tax_code_used}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(p.gross_pay)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(p.income_tax)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(p.employee_ni)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-purple-700">{formatCurrency(p.net_pay)}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/api/admin/paye/payslips/${p.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline"><Download className="h-3.5 w-3.5" /> Payslip</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-purple-700" : "text-slate-900"}`}>{formatCurrency(value)}</p>
    </div>
  );
}
