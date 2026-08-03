import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Wallet, Check, X, ArrowRight } from "lucide-react-native";
import { Card } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, upperName } from "@/lib/utils";
import { SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { ServiceType } from "@/types";

interface PendingDeposit {
  id: string;
  reference: string;
  service_type: ServiceType;
  move_date: string | null;
  deposit_amount: number | null;
  claimed: boolean;
  customer_name: string;
  customer_phone: string | null;
}

/**
 * Dashboard action queue: every booking whose deposit invoice is out but not yet
 * verified. Two taps to confirm (arm → confirm) so it can't misfire; confirming
 * marks the job confirmed and notifies the customer. Hidden when nothing waits.
 * Mirrors the web dashboard's DepositsToConfirm.
 */
export function DepositsToConfirm({ onConfirmed }: { onConfirmed?: () => void }) {
  const [items, setItems] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/deposits/pending");
      const json = await res.json();
      if (json.success) setItems(json.items as PendingDeposit[]);
    } catch {
      /* non-fatal — widget just stays hidden */
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const confirm = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/bookings/${id}/confirm-deposit`, { method: "POST" });
      toast.success("Deposit confirmed", "Customer notified");
      setItems((prev) => prev.filter((i) => i.id !== id));
      onConfirmed?.();
    } catch (e) {
      toast.error("Couldn't confirm the deposit", e instanceof Error ? e.message : undefined);
    } finally {
      setBusyId(null);
      setArmedId(null);
    }
  }, [onConfirmed]);

  if (loading || items.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <View className="mb-3 flex-row items-center gap-2.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
          <Wallet size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="font-display text-base text-amber-900">Deposits to confirm</Text>
          <Text className="text-xs text-amber-700">Check your bank, then confirm to lock in the job.</Text>
        </View>
        <View className="rounded-full bg-amber-500 px-2.5 py-1">
          <Text className="text-xs font-bold text-white">{items.length}</Text>
        </View>
      </View>

      <View className="gap-2.5">
        {items.map((d) => {
          const armed = armedId === d.id;
          const busy = busyId === d.id;
          return (
            <View key={d.id} className="rounded-xl border border-amber-100 bg-white p-3">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 font-semibold text-slate-900" numberOfLines={1}>{upperName(d.customer_name)}</Text>
                {d.claimed && (
                  <View className="rounded-full bg-brand-green-100 px-2 py-0.5">
                    <Text className="text-[11px] font-bold text-brand-green-800">Says paid</Text>
                  </View>
                )}
              </View>
              <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
                {d.reference} · {SERVICE_LABELS_SHORT[d.service_type] ?? d.service_type}
                {d.move_date ? ` · moves ${formatDate(d.move_date)}` : ""}
              </Text>

              <View className="mt-2.5 flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-bold text-slate-900">
                    {d.deposit_amount != null ? formatCurrency(d.deposit_amount) : "—"}
                  </Text>
                  <Text className="text-[11px] text-slate-400">deposit due</Text>
                </View>

                {armed ? (
                  <View className="flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => confirm(d.id)}
                      disabled={busy}
                      className="flex-row items-center gap-1.5 rounded-xl bg-brand-green-600 px-4 py-2.5"
                    >
                      {busy ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
                      <Text className="text-sm font-bold text-white">Money&apos;s in</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setArmedId(null)}
                      disabled={busy}
                      className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
                    >
                      <X size={16} color="#64748b" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setArmedId(d.id)}
                    className="flex-row items-center gap-1 rounded-xl border border-amber-300 bg-white px-4 py-2.5"
                  >
                    <Text className="text-sm font-semibold text-amber-800">Confirm received</Text>
                    <ArrowRight size={14} color="#92400e" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
