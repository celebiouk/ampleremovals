"use client";

import { useEffect, useState } from "react";
import { Zap, ToggleLeft, ToggleRight, Clock, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AutomationRule {
  id: string; name: string; trigger_event: string; action_type: string;
  delay_minutes: number; is_active: boolean; created_at: string;
  sent_count?: number;
}

function delayLabel(minutes: number): string {
  if (minutes === 0) return "Immediately";
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) return `${minutes / 60} hours`;
  return `${minutes / 1440} days`;
}

function triggerLabel(event: string): string {
  const map: Record<string, string> = {
    booking_created: "When a booking is created",
    status_changed_not_answered: "When status changes to Not Answered",
    invoice_sent_unpaid: "When invoice is unpaid after delay",
    status_changed_job_confirmed: "When job is confirmed",
    move_date_tomorrow: "When move date is tomorrow",
    status_changed_completed: "When job is completed",
    status_changed_bad_lead: "When marked as bad lead",
  };
  return map[event] ?? event;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("automation_rules").select("*").order("created_at");

      // Get sent counts
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: logs } = await supabase.from("automation_logs").select("rule_id").in("rule_id", ids).eq("status", "sent");
        (logs ?? []).forEach((l: { rule_id: string }) => { counts[l.rule_id] = (counts[l.rule_id] ?? 0) + 1; });
      }

      setRules((data ?? []).map((r: AutomationRule) => ({ ...r, sent_count: counts[r.id] ?? 0 })));
      setIsLoading(false);
    };
    load();
  }, []);

  const toggleRule = async (id: string, current: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("automation_rules").update({ is_active: !current }).eq("id", id);
    if (!error) {
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
      toast.success(`Automation ${!current ? "activated" : "paused"}`);
    } else toast.error("Failed to update automation");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Automations</h2>
          <p className="text-sm text-slate-500">Set up automatic emails and SMS messages that fire based on booking events.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <Zap className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-500">No automations yet</p>
          <p className="mt-1 text-sm text-slate-400">Run the Phase 4B database migration to seed the built-in rules.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-4">
                {/* Toggle */}
                <button onClick={() => toggleRule(rule.id, rule.is_active)} className="shrink-0 text-slate-400 hover:text-slate-600">
                  {rule.is_active
                    ? <ToggleRight className="h-7 w-7 text-brand-green-600" />
                    : <ToggleLeft className="h-7 w-7 text-slate-400" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{rule.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rule.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {rule.is_active ? "Active" : "Paused"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rule.action_type === "email" ? "bg-blue-100 text-blue-700" : rule.action_type === "sms" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}`}>
                      {rule.action_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {triggerLabel(rule.trigger_event)} → {delayLabel(rule.delay_minutes)}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex shrink-0 items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Send className="h-3.5 w-3.5" />{rule.sent_count ?? 0} sent</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{delayLabel(rule.delay_minutes)}</span>
                </div>

                {/* Expand */}
                <button onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  className="shrink-0 text-slate-400 hover:text-slate-600">
                  {expandedRule === rule.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {expandedRule === rule.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs font-semibold uppercase text-slate-400">Trigger</dt><dd className="mt-1 text-slate-700">{triggerLabel(rule.trigger_event)}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-slate-400">Delay</dt><dd className="mt-1 text-slate-700">{delayLabel(rule.delay_minutes)}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-slate-400">Action</dt><dd className="mt-1 capitalize text-slate-700">{rule.action_type}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-slate-400">Total Sent</dt><dd className="mt-1 font-bold text-brand-purple-700">{rule.sent_count ?? 0}</dd></div>
                  </dl>
                  <p className="mt-3 text-xs text-slate-400">Rule ID: {rule.id}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
