import { useState } from "react";
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, Plus, Check, X, PenLine, User } from "lucide-react-native";
import { Screen, Card, Button, toast } from "@/components/ui";
import { CameraCapture } from "@/components/CameraCapture";
import { SignaturePad } from "@/components/SignaturePad";
import { uploadImage, uploadSignature } from "@/lib/upload";
import { apiFetch } from "@/lib/api";
import { useJob } from "@/hooks/queries";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Photo { uri: string; path?: string; uploading: boolean; failed?: boolean }

/**
 * Access/damage-risk incident report — for when the driver finds a specific
 * situation (an item, doorway, or piece of property) that risks damage, tells
 * the customer, and the customer agrees to proceed anyway. Unlike the generic
 * one-per-job liability waiver (waiver.tsx), this captures the driver's own
 * account of THIS situation + photos, and a job can have more than one.
 */
export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const job = useJob(id);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState<{ dataUrl: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reference = job.data?.reference ?? id;
  const photoDir = `jobs/${reference}/incidents/${Date.now()}/photos`;

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
  const canSubmit = description.trim().length > 0 && uploadedPhotos >= 1 && signerName.trim().length > 0 && !!signature && !anyUploading;

  async function submit() {
    if (!canSubmit) {
      if (!description.trim()) toast.warning("Describe the risk you found");
      else if (uploadedPhotos < 1) toast.warning("Add at least one photo of the situation");
      else if (!signerName.trim()) toast.warning("Enter who is signing");
      else if (!signature) toast.warning("Capture the customer's signature");
      return;
    }
    setSubmitting(true);
    try {
      const { path: sigPath } = await uploadSignature(signature!.dataUrl, `jobs/${reference}/incidents/${Date.now()}/signature`);
      await apiFetch(`/api/drivers/jobs/${id}/incident`, {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
          photo_paths: photos.filter((p) => p.path).map((p) => p.path),
          signer_name: signerName.trim(),
          signature_url: sigPath,
        }),
      });
      await qc.invalidateQueries({ queryKey: ["job", id] });
      toast.success("Incident reported");
      router.back();
    } catch (e) {
      toast.error("Couldn't submit", (e as Error)?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Access/damage risk" subtitle={reference} back>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          <AlertTriangle size={18} color={colors.primary.DEFAULT} />
          <Text style={[type.label, { color: colors.primary.DEFAULT }]}>Only use this if the customer wants to proceed</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[700], lineHeight: 22 }]}>
          If moving an item safely isn&apos;t possible without a real risk of damage — to the item, a
          doorway, or the property — tell the customer first. If they still want you to go ahead, use
          this form to record what you told them and get their sign-off for that specific decision.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Step 1 · What&apos;s the problem?</Text>
        <TextInput
          value={description} onChangeText={setDescription} multiline
          placeholder="e.g. Wardrobe won't clear the bedroom doorway without removing the door — risk of scratching the frame or the item…"
          placeholderTextColor={colors.slate[400]}
          style={[type.bodyLarge, { color: colors.slate[900], minHeight: 100, textAlignVertical: "top", borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, padding: spacing.md }]}
        />
      </Card>

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: 4 }]}>Step 2 · Photograph the situation</Text>
        <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: spacing.md }]}>At least one photo is required.</Text>
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

      <Card style={{ marginTop: spacing.base }}>
        <Text style={[type.label, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>Step 3 · Who&apos;s agreeing to this</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <User size={18} color={colors.slate[400]} />
          <TextInput
            value={signerName} onChangeText={setSignerName}
            placeholder="Full name of person present" placeholderTextColor={colors.slate[400]}
            style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 52 }]}
          />
        </View>
        {description.trim() ? (
          <Text style={[type.bodySmall, { color: colors.slate[500], lineHeight: 20, marginBottom: spacing.md }]}>
            By signing, {signerName.trim() || "the customer"} confirms the driver explained: &quot;{description.trim()}&quot; —
            and understands this may risk damage to the item and/or the property, but is asking Ample
            Removals to go ahead anyway. Ample Removals is not liable for damage arising from this
            specific decision.
          </Text>
        ) : null}
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
          label="Submit report" variant="primary"
          icon={<Check size={18} color={colors.white} />}
          loading={submitting} disabled={!canSubmit} onPress={submit} fullWidth
        />
        {!canSubmit ? (
          <Text style={[type.bodySmall, { color: colors.slate[400], textAlign: "center", marginTop: spacing.sm }]}>
            A description, at least one photo, a name and a signature are all required.
          </Text>
        ) : null}
      </View>

      <CameraCapture visible={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={addPhoto} />
      <SignaturePad visible={signOpen} name={signerName} onClose={() => setSignOpen(false)} onOK={(dataUrl) => { setSignature({ dataUrl }); setSignOpen(false); }} />
    </Screen>
  );
}
