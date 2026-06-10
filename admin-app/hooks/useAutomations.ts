/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AutomationRule {
  id: string;
  name: string;
  trigger_event: string;
  delay_minutes: number | null;
  is_active: boolean;
}

export interface AutomationLog {
  id: string;
  rule_id: string | null;
  booking_id: string | null;
  status: string;
  triggered_at: string;
}

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const [{ data: rules }, { data: logs }] = await Promise.all([
        supabase.from("automation_rules").select("id, name, trigger_event, delay_minutes, is_active").order("name"),
        supabase.from("automation_logs").select("id, rule_id, booking_id, status, triggered_at").order("triggered_at", { ascending: false }).limit(25),
      ]);
      return { rules: (rules as AutomationRule[]) ?? [], logs: (logs as AutomationLog[]) ?? [] };
    },
  });
}
