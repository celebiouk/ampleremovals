import { useState } from "react";
import { View, Text, TextInput, Pressable, Image, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, PenLine, User, FileText, ExternalLink } from "lucide-react-native";
import { Screen, Card, Button, toast } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { uploadSignature } from "@/lib/upload";
import { apiFetch } from "@/lib/api";
import { useJob } from "@/hooks/queries";
import { ENV } from "@/lib/env";
import { colors, radius, spacing, type } from "@/lib/theme";

const SITE = ENV.SITE_URL || "https://www.ampleremovals.com";

const WAIVER_TEXT =
  "I confirm that I was responsible for protecting and preparing my goods and property before this move. " +
  "In the event of any damage arising during the move — including damage to items or to the collection or " +
  "delivery property — I agree that Ample Removals' liability to me is waived. I confirm I have read and " +
  "agree to the Terms & Conditions on the Ample Removals website.";

export default function WaiverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const job = useJob(id);
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState<{ dataUrl: string } | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reference = job.data?.reference ?? id;
  const canSubmit = signerName.trim().length > 0 && !!signature;

  async function submit() {
    if (!canSubmit) {
      if (!signerName.trim()) toast.warning("Enter who is signing");
      else if (!signature) toast.warning("Capture the customer's signature");
      return;
    }
    setSubmitting(true);
    try {
      const { path: sigPath } = await uploadSignature(signature!.dataUrl, `jobs/${reference}/waiver/signature-${Date.now()}`);
      await apiFetch(`/api/drivers/jobs/${id}/waiver`, {
        method: "POST",
        body: JSON.stringify({ signer_name: signerName.trim(), signature_url: sigPath }),
      });
      await qc.invalidateQueries({ queryKey: ["job", id] });
      toast.success("Waiver signed");
      router.back();
    } catch (e) {
      toast.error("Couldn't submit", (e as Error)?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Liability waiver" subtitle={reference} back>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          <FileText size={18} color={colors.primary.DEFAULT} />
          <Text style={[type.label, { color: colors.primary.DEFAULT }]}>Damage liability waiver</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[700], lineHeight: 22 }]}>{WAIVER_TEXT}</Text>
        <Pressable
          onPress={() => Linking.openURL(`${SITE}/terms`)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}
        >
          <ExternalLink size={16} color={colors.primary.DEFAULT} />
          <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Read the full Terms &amp; Conditions</Text>
        </Pressable>
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Who is signing</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }}>
          <User size={18} color={colors.slate[400]} />
          <TextInput
            value={signerName} onChangeText={setSignerName}
            placeholder="Full name of person present" placeholderTextColor={colors.slate[400]}
            style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 52 }]}
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Signature</Text>
        {signature ? (
          <View style={{ alignItems: "center" }}>
            <Image source={{ uri: signature.dataUrl }} style={{ width: "100%", height: 120, resizeMode: "contain" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm }}>
              <Check size={16} color={colors.accent.DEFAULT} />
              <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>Signature captured</Text>
              <Pressable onPress={() => setSignOpen(true)}>
                <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginLeft: spacing.sm }]}>Redo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Button label="Capture signature" variant="outline" icon={<PenLine size={18} color={colors.primary.DEFAULT} />} onPress={() => setSignOpen(true)} fullWidth />
        )}
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label="Submit waiver" variant="primary"
          icon={<Check size={18} color={colors.white} />}
          loading={submitting} disabled={!canSubmit} onPress={submit} fullWidth
        />
        {!canSubmit ? (
          <Text style={[type.bodySmall, { color: colors.slate[400], textAlign: "center", marginTop: spacing.sm }]}>
            A name and signature are required.
          </Text>
        ) : null}
      </View>

      <SignaturePad visible={signOpen} name={signerName} onClose={() => setSignOpen(false)} onOK={(dataUrl) => { setSignature({ dataUrl }); setSignOpen(false); }} />
    </Screen>
  );
}
