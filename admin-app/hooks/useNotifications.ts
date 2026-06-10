import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  description: string;
  booking_id: string | null;
  is_read: boolean | null;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as NotificationRow[]) ?? [];
    },
  });
}
