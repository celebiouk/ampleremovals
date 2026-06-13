/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { Card, Button, Badge, Skeleton, ErrorState } from "@/components/ui";
import { useInvoiceDetail } from "@/hooks/useInvoices";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLOURS } from "@/lib/constants";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: inv, isLoading, isError, refetch, isRefetching } = useInvoiceDetail(id!);
  const [busy, setBusy] = useState<string | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    try { await fn(); refresh(); }
    catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(null); }
  }

  const send = () => run("send", () => apiFetch("/api/admin/invoices/send", { method: "POST", body: JSON.stringify({ invoiceId: id }) }).then(() => { Alert.alert("Sent", "Invoice sent to the customer."); }));
  const resend = () => run("resend", () => apiFetch("/api/admin/invoices/resend", { method: "POST", body: JSON.stringify({ invoiceId: id }) }).then(() => { Alert.alert("Resent", "Invoice resent."); }));
  const voidInvoice = () => Alert.alert("Void invoice", "This cannot be undone. Void this invoice?", [
    { text: "Cancel", style: "cancel" },
    { text: "Void", style: "destructive", onPress: () => run("void", () => apiFetch(`/api/admin/invoices/${id}/void`, { method: "PATCH" }).then(() => {})) },
  ]);

  function markPaid() {
    Alert.alert("Mark as paid", "How was it paid?", [
      { text: "Bank transfer", onPress: () => doPay("bank_transfer") },
      { text: "Cash", onPress: () => doPay("cash") },
      { text: "Card", onPress: () => doPay("card") },
      { text: "Cancel", style: "cancel" },
    ]);
  }
  const doPay = (method: string) => run("pay", () => apiFetch(`/api/admin/invoices/${id}/mark-paid`, { method: "PATCH", body: JSON.stringify({ paymentMethod: method }) }).then(() => { Alert.alert("Marked paid", "Invoice marked as paid."); }));

  async function viewPdf() {
    setBusy("pdf");
    try {
      const res = await apiFetch(`/api/admin/invoices/${id}/pdf`);
      const data = (await res.json()) as { success: boolean; url: string };
      if (data.url) await Linking.openURL(data.url);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "PDF not available");
    } finally { setBusy(null); }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-mono text-base font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {inv?.invoice_number ?? "Invoice"}
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-4 p-5"><Skeleton className="h-40" /><Skeleton className="h-32" /></View>
      ) : isError || !inv ? (
        <ErrorState message="Couldn't load this invoice." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="p-5 gap-4 pb-12" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          <Card>
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              <Badge label={INVOICE_STATUS_LABELS[inv.status]} colour={INVOICE_STATUS_COLOURS[inv.status]} />
              <Badge label={inv.type === "deposit" ? "Deposit" : "Full balance"} colour="bg-slate-100 text-slate-600" />
            </View>
            <Text className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(inv.total)}</Text>
            <Text className="mt-1 text-slate-500 dark:text-slate-400">{inv.customer_name} · {inv.booking_reference}</Text>
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Breakdown</Text>
            <Row label="Subtotal" value={formatCurrency(inv.subtotal)} />
            <Row label={`VAT (${inv.vat_rate}%)`} value={formatCurrency(inv.vat_amount)} />
            <View className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
            <Row label="Total" value={formatCurrency(inv.total)} bold />
            {inv.due_date ? <Row label="Due date" value={formatDate(inv.due_date)} /> : null}
            {inv.paid_at ? <Row label="Paid" value={formatDate(inv.paid_at)} /> : null}
          </Card>

          {/* Actions */}
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Actions</Text>
            <View className="gap-2">
              {inv.status === "draft" ? (
                <Button label="Send invoice" onPress={send} loading={busy === "send"} />
              ) : null}
              {(inv.status === "sent" || inv.status === "overdue") ? (
                <>
                  <Button label="Resend invoice" variant="outline" onPress={resend} loading={busy === "resend"} />
                  <Button label="Mark as paid" variant="secondary" onPress={markPaid} loading={busy === "pay"} />
                </>
              ) : null}
              <Button label="View PDF" variant="outline" onPress={viewPdf} loading={busy === "pdf"} />
              {(inv.status !== "paid" && inv.status !== "void" && inv.status !== "cancelled") ? (
                <Button label="Void invoice" variant="danger" onPress={voidInvoice} loading={busy === "void"} />
              ) : null}
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className={`text-sm ${bold ? "font-bold" : "font-medium"} text-slate-900 dark:text-white`}>{value}</Text>
    </View>
  );
}
