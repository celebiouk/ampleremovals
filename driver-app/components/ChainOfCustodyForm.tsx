import { useState } from "react";
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Camera, Plus, Check, X, PenLine, User } from "lucide-react-native";
import { Card, Button, toast } from "@/components/ui";
import { CameraCapture } from "@/components/CameraCapture";
import { SignaturePad } from "@/components/SignaturePad";
import { uploadImage, uploadSignature } from "@/lib/upload";
import { apiFetch } from "@/lib/api";
import { stopBackgroundLocation } from "@/lib/location-task";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Photo { uri: string; path?: string; uploading: boolean; failed?: boolean }

/**
 * The shared pickup/delivery proof-of-custody flow:
 *   contact name → load photos (≥1) → comments → signature → submit.
 * Photos and the signature go to Storage; the endpoint records the confirmation.
 */
export function ChainOfCustodyForm({
  jobId, reference, leg,
}: { jobId: string; reference: string; leg: "pickup" | "delivery" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [contactName, setContactName] = useState("");
  const [comments, setComments] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signature, setSignature] = useState<{ dataUrl: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const photoDir = `jobs/${reference}/${leg}/photos`;

  async function addPhoto(uri: string) {
    setCameraOpen(false);
    const idx = photos.length;
    setPhotos((p) => [...p, { uri, uploading: true }]);
    try {
      const { path } = await uploadImage(uri, `${photoDir}/${Date.now()}-${idx}`);
      setPhotos((p) => p.map((ph, i) => (i === idx ? { ...ph, path, uploading: false } : ph)));
    } catch (e) {
      setPhotos((p) => p.map((ph, i) => (i === idx ? { ...ph, uploading: false, failed: true } : ph)));
      toast.error("Photo upload failed", (e as Error)?.message);
    }
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  const uploadedPhotos = photos.filter((p) => p.path).length;
  const anyUploading = photos.some((p) => p.uploading);
  const canSubmit = contactName.trim().length > 0 && uploadedPhotos >= 1 && !!signature && !anyUploading;

  async function submit() {
    if (!canSubmit) {
      if (uploadedPhotos < 1) toast.warning("Add at least one photo of the load");
      else if (!signature) toast.warning("Capture the customer's signature");
      else if (!contactName.trim()) toast.warning("Enter who signed");
      return;
    }
    setSubmitting(true);
    try {
      const { path: sigPath } = await uploadSignature(signature!.dataUrl, `jobs/${reference}/${leg}/signature-${Date.now()}`);
      await apiFetch(`/api/drivers/jobs/${jobId}/${leg}`, {
        method: "POST",
        body: JSON.stringify({ contact_name: contactName.trim(), comments: comments.trim() || null, signature_url: sigPath }),
      });
      // The leg is done — stop background GPS until the next journey starts.
      await stopBackgroundLocation();
      await qc.invalidateQueries({ queryKey: ["job", jobId] });
      await qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(`${leg === "pickup" ? "Pickup" : "Delivery"} confirmed`);
      router.back();
    } catch (e) {
      toast.error("Couldn't submit", (e as Error)?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Who signed */}
      <Card>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Step 1 · Who&apos;s signing off</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md }}>
          <User size={18} color={colors.slate[400]} />
          <TextInput
            value={contactName} onChangeText={setContactName}
            placeholder="Full name of person present" placeholderTextColor={colors.slate[400]}
            style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 52 }]}
          />
        </View>
      </Card>

      {/* Photos */}
      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: 4 }]}>Step 2 · Photograph the load</Text>
        <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: spacing.md }]}>At least one photo is required as proof of condition.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {photos.map((p, i) => (
            <View key={i} style={{ width: 96, height: 96, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.slate[100] }}>
              <Image source={{ uri: p.uri }} style={{ width: 96, height: 96 }} />
              {p.uploading ? (
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : null}
              {p.failed ? (
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(220,38,38,0.4)" }}>
                  <X size={20} color={colors.white} />
                </View>
              ) : null}
              <Pressable onPress={() => removePhoto(i)} style={{ position: "absolute", top: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={() => setCameraOpen(true)} style={{ width: 96, height: 96, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary.surfaceMid, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary.surface }}>
            {photos.length === 0 ? <Camera size={26} color={colors.primary.DEFAULT} /> : <Plus size={26} color={colors.primary.DEFAULT} />}
          </Pressable>
        </View>
      </Card>

      {/* Comments */}
      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Step 3 · Comments (optional)</Text>
        <TextInput
          value={comments} onChangeText={setComments} multiline
          placeholder="Any damage, notes, or conditions worth recording…" placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], minHeight: 88, textAlignVertical: "top", borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, padding: spacing.md }]}
        />
      </Card>

      {/* Signature */}
      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Step 4 · Customer signature</Text>
        {signature ? (
          <View style={{ alignItems: "center" }}>
            <Image source={{ uri: signature.dataUrl }} style={{ width: "100%", height: 120, resizeMode: "contain" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm }}>
              <Check size={16} color={colors.accent.DEFAULT} />
              <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>Signature captured</Text>
              <Pressable onPress={() => setSignOpen(true)}><Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginLeft: spacing.sm }]}>Redo</Text></Pressable>
            </View>
          </View>
        ) : (
          <Button label="Capture signature" variant="outline" icon={<PenLine size={18} color={colors.primary.DEFAULT} />} onPress={() => setSignOpen(true)} fullWidth />
        )}
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label={leg === "pickup" ? "Confirm pickup" : "Confirm delivery"}
          variant={leg === "pickup" ? "primary" : "accent"}
          icon={<Check size={18} color={colors.white} />}
          loading={submitting}
          disabled={!canSubmit}
          onPress={submit}
          fullWidth
        />
        {!canSubmit ? (
          <Text style={[type.bodySmall, { color: colors.slate[400], textAlign: "center", marginTop: spacing.sm }]}>
            Name, at least one photo and a signature are required.
          </Text>
        ) : null}
      </View>

      <CameraCapture visible={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={addPhoto} />
      <SignaturePad visible={signOpen} name={contactName} onClose={() => setSignOpen(false)} onOK={(dataUrl) => { setSignature({ dataUrl }); setSignOpen(false); }} />
    </>
  );
}
