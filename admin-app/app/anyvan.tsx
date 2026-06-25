import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck, Check, Star } from "lucide-react-native";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { Card, Button, Input, Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { DateField } from "@/components/DateField";
import { useAnyVanJobs, useAddAnyVanJob } from "@/hooks/useOps";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

export default function AnyVanScreen() {
  const list = useAnyVanJobs();
  const add = useAddAnyVanJob();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [driver, setDriver] = useState("");

  async function submit() {
    if (!name.trim() || !phone.trim()) return Alert.alert("Missing details", "Customer name and phone are required.");
    if (!ISO_DATE.test(date) || !HHMM.test(time)) return Alert.alert("Date / time", "Enter the delivery date as YYYY-MM-DD and time as HH:MM.");
    const job_at = new Date(`${date}T${time}:00`).toISOString();
    try {
      await add.mutateAsync({
        customer_name: name.trim(), phone: phone.trim(),
        email: email.trim() || undefined,
        amount: amount ? Number(amount) : undefined,
        job_at,
        // driver_name passed straight through (endpoint accepts it)
        ...(driver.trim() ? { driver_name: driver.trim() } as Record<string, string> : {}),
      } as Parameters<typeof add.mutateAsync>[0]);
      Alert.alert("Saved", "The customer will be asked to rate the driver 48 hours after the job.");
      setName(""); setPhone(""); setEmail(""); setAmount(""); setDate(""); setTime(""); setDriver("");
    } catch (e) {
      Alert.alert("Couldn't save", (e as Error)?.message ?? "Try again");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <LargeHeader title="AnyVan Jobs" />
      <ScrollView contentContainerClassName="px-4 pb-12" keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: 10 }]}>Record an AnyVan job</Text>
          <Input label="Customer name" value={name} onChangeText={setName} placeholder="Full name" />
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="07…" keyboardType="phone-pad" />
          <Input label="Email (optional)" value={email} onChangeText={setEmail} placeholder="name@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Input label="Amount (£, optional)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <View className="flex-row gap-3">
            <View className="flex-1"><DateField label="Delivery date" value={date} onChange={setDate} placeholder="Pick date" /></View>
            <View className="flex-1"><DateField label="Time" mode="time" value={time} onChange={setTime} placeholder="Pick time" /></View>
          </View>
          <Input label="Driver name" value={driver} onChangeText={setDriver} placeholder="Who did the job" />
          <View className="mt-2">
            <Button label="Save AnyVan job" icon={<Check size={18} color={colors.white} />} loading={add.isPending} onPress={submit} />
          </View>
        </Card>

        <Text style={[type.label, { color: colors.slate[500], marginTop: 20, marginBottom: 8 }]}>Recent AnyVan jobs</Text>
        {list.isLoading ? (
          <Skeleton style={{ height: 80, borderRadius: 16 }} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} />
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState title="No AnyVan jobs yet" message="Jobs you record appear here." icon={<Truck size={48} color={colors.primary.lighter} />} />
        ) : (
          (list.data ?? []).map((j) => (
            <Card key={j.id} style={{ marginBottom: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{j.customer_name}</Text>
                {j.rating != null ? (
                  <View className="flex-row items-center gap-1">
                    <Star size={14} color="#f59e0b" fill="#f59e0b" /><Text style={[type.bodySmall, { color: colors.slate[700] }]}>{j.rating}/5</Text>
                  </View>
                ) : (
                  <Badge label={j.rating_request_sent ? "Awaiting rating" : "Scheduled"} variant="slate" />
                )}
              </View>
              <Text style={[type.bodySmall, { color: colors.slate[500], marginTop: 2 }]}>
                {j.driver_name ? `${j.driver_name} · ` : ""}{new Date(j.job_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {j.amount != null ? ` · £${Number(j.amount).toFixed(2)}` : ""}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
