import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Settings {
  id?: number;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  google_review_link: string | null;
  notify_new_booking: boolean | null;
  notify_invoice_paid: boolean | null;
  notify_invoice_overdue: boolean | null;
  notify_move_date_tomorrow: boolean | null;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as Settings;
    },
  });
}
