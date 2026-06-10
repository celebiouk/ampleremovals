/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, Modal, Alert, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck, Plus, X, PoundSterling } from "lucide-react-native";
import { Card, Button, Avatar } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { useDrivers } from "@/hooks/useDrivers";

export function AssignedDriversSection({ bookingId }: { bookingId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [tipFor, setTipFor] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const { data: driversData } = useDrivers();

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ success: boolean; assignments: any[] }>(`/api/admin/bookings/${bookingId}/drivers`);
      setAssignments(res.assignments ?? []);
    } catch { /* shown elsewhere */ }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  async function assign(driverId: string) {
    setPickOpen(false);
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}/assign-driver`, {
        method: "POST",
        body: JSON.stringify({ driverId, isLeadDriver: assignments.length === 0 }),
      });
      toast.success("Driver assigned");
      load();
    } catch (e) {
      toast.error("Failed to assign", e instanceof Error ? e.message : undefined);
    }
  }

  function confirmRemove(assignmentId: string, name: string) {
    Alert.alert("Remove driver", `Remove ${name} from this job?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/admin/bookings/${bookingId}/drivers`, { method: "DELETE", body: JSON.stringify({ assignmentId }) });
            load();
          } catch (e) { toast.error("Failed", e instanceof Error ? e.message : undefined); }
        },
      },
    ]);
  }

  async function saveTip(driverId: string) {
    const amount = parseFloat(tipAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid tip"); return; }
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}/tips`, {
        method: "POST",
        body: JSON.stringify({ driverId, amount }),
      });
      toast.success(`Tip of £${amount.toFixed(2)} recorded`);
      setTipFor(null); setTipAmount("");
    } catch (e) {
      toast.error("Failed", e instanceof Error ? e.message : undefined);
    }
  }

  const activeDrivers = (driversData?.drivers ?? []).filter((d) => d.status === "active");
  const assignedIds = new Set(assignments.map((a) => a.driver_id));

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Truck size={18} color={colors.primary.DEFAULT} />
          <Text style={[type.h3, { color: colors.slate[900] }]}>Assigned drivers</Text>
        </View>
        <Pressable onPress={() => setPickOpen(true)} accessibilityLabel="Assign driver" style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Plus size={16} color={colors.primary.DEFAULT} />
          <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Assign</Text>
        </Pressable>
      </View>

      {assignments.length === 0 ? (
        <Text style={[type.body, { color: colors.slate[500] }]}>No drivers assigned yet.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {assignments.map((a) => {
            const name = `${a.driver?.first_name ?? ""} ${a.driver?.last_name ?? ""}`.trim() || "Driver";
            return (
              <View key={a.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={name} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{name}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[500] }]}>
                      Pay {a.pay_percentage_override ?? a.driver?.default_pay_percentage ?? 0}%{a.is_lead_driver ? " · Lead" : ""}
                    </Text>
                  </View>
                  <Pressable onPress={() => { setTipFor(a.driver_id); setTipAmount(""); }} hitSlop={8} accessibilityLabel="Record tip" style={{ padding: 6 }}>
                    <PoundSterling size={18} color={colors.accent.DEFAULT} />
                  </Pressable>
                  <Pressable onPress={() => confirmRemove(a.id, name)} hitSlop={8} accessibilityLabel="Remove driver" style={{ padding: 6 }}>
                    <X size={18} color={colors.danger.DEFAULT} />
                  </Pressable>
                </View>
                {tipFor === a.driver_id ? (
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      value={tipAmount}
                      onChangeText={setTipAmount}
                      placeholder="Tip £"
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.slate[400]}
                      style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate[300], paddingHorizontal: 14, fontFamily: type.body.fontFamily, color: colors.slate[900] }}
                    />
                    <Button label="Save" size="sm" variant="accent" onPress={() => saveTip(a.driver_id)} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Driver picker */}
      <Modal visible={pickOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Assign a driver</Text>
            <Pressable onPress={() => setPickOpen(false)}><X size={24} color={colors.slate[400]} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {activeDrivers.length === 0 ? (
              <Text style={[type.body, { color: colors.slate[500], textAlign: "center", paddingVertical: 24 }]}>No active drivers.</Text>
            ) : (
              activeDrivers.map((d) => {
                const already = assignedIds.has(d.id);
                return (
                  <Pressable
                    key={d.id}
                    disabled={already}
                    onPress={() => assign(d.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[100], opacity: already ? 0.4 : 1 }}
                  >
                    <Avatar name={`${d.first_name} ${d.last_name}`} size="md" />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{d.first_name} {d.last_name}</Text>
                      <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Default pay {d.default_pay_percentage}%</Text>
                    </View>
                    {already ? <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Assigned</Text> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Card>
  );
}
