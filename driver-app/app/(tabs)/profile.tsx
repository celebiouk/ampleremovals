import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Image } from "react-native";
import Constants from "expo-constants";
import { Camera, LogOut, Car, IdCard, Phone, User, ShieldAlert, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Screen, Card, Button, toast } from "@/components/ui";
import { CameraCapture } from "@/components/CameraCapture";
import { useDriverProfile } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { unregisterPush } from "@/lib/push";
import { stopBackgroundLocation } from "@/lib/location-task";
import { uploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import { colors, radius, spacing, type } from "@/lib/theme";
import { formatDate } from "@/lib/format";

function Field({ label, value, onChangeText, icon, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void; icon: React.ReactNode; placeholder?: string; keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.bodySemiBold, { color: colors.slate[700], marginBottom: 6 }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.white }}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.slate[400]}
          keyboardType={keyboardType}
          style={[type.bodyLarge, { flex: 1, color: colors.slate[900], height: 50 }]}
        />
      </View>
    </View>
  );
}

function ReadOnly({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }}>
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.slate[50], alignItems: "center", justifyContent: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[type.bodySmall, { color: colors.slate[400] }]}>{label}</Text>
        <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data: driver, refetch } = useDriverProfile();
  const driverId = useAuthStore((s) => s.driverId);
  const session = useAuthStore((s) => s.session);

  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecRel, setEcRel] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!driver) return;
    setPreferredName(driver.preferred_name ?? "");
    setPhone(driver.phone ?? "");
    setEcName(driver.emergency_contact_name ?? "");
    setEcPhone(driver.emergency_contact_phone ?? "");
    setEcRel(driver.emergency_contact_relationship ?? "");
    if (driver.profile_photo_url) {
      supabase.storage.from("driver-documents").createSignedUrl(driver.profile_photo_url, 3600).then(({ data }) => {
        if (data?.signedUrl) setPhotoUrl(data.signedUrl);
      });
    }
  }, [driver]);

  async function save() {
    if (!driverId) return;
    setSaving(true);
    const { error } = await supabase.from("drivers").update({
      preferred_name: preferredName || null,
      phone: phone || null,
      emergency_contact_name: ecName || null,
      emergency_contact_phone: ecPhone || null,
      emergency_contact_relationship: ecRel || null,
      updated_at: new Date().toISOString(),
    }).eq("id", driverId);
    setSaving(false);
    if (error) toast.error("Could not save", error.message);
    else { toast.success("Profile updated"); refetch(); }
  }

  async function onPhoto(uri: string) {
    setCameraOpen(false);
    if (!driverId) return;
    setUploading(true);
    try {
      const { signedUrl } = await uploadImage(uri, `${driverId}/profile-photo.jpg`);
      // Persist the path so the office sees it too.
      await supabase.from("drivers").update({ profile_photo_url: `${driverId}/profile-photo.jpg`, updated_at: new Date().toISOString() }).eq("id", driverId);
      if (signedUrl) setPhotoUrl(signedUrl);
      toast.success("Photo updated");
    } catch (e) {
      toast.error("Upload failed", (e as Error)?.message);
    } finally {
      setUploading(false);
    }
  }

  async function doSignOut() {
    await stopBackgroundLocation();
    await unregisterPush();
    await signOut();
  }

  const fullName = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || "Driver";
  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Screen title="Profile" onRefresh={refetch}>
      {/* Identity */}
      <Card style={{ alignItems: "center", paddingVertical: spacing.xl }}>
        <Pressable onPress={() => setCameraOpen(true)} style={{ marginBottom: spacing.md }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: 96, height: 96 }} /> : <Text style={[type.display, { color: colors.primary.DEFAULT }]}>{initials}</Text>}
          </View>
          <View style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary.DEFAULT, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.white }}>
            <Camera size={16} color={colors.white} />
          </View>
        </Pressable>
        <Text style={[type.h2, { color: colors.slate[900] }]}>{fullName}</Text>
        <Text style={[type.body, { color: colors.slate[500] }]}>{driver?.email ?? session?.user?.email}</Text>
        {uploading ? <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, marginTop: 6 }]}>Uploading photo…</Text> : null}
      </Card>

      {/* Editable details */}
      <Text style={[type.h3, { color: colors.slate[900], marginTop: spacing.xl, marginBottom: spacing.md }]}>My details</Text>
      <Card>
        <Field label="Preferred name" value={preferredName} onChangeText={setPreferredName} icon={<User size={18} color={colors.slate[400]} />} placeholder="What should we call you?" />
        <Field label="Phone" value={phone} onChangeText={setPhone} icon={<Phone size={18} color={colors.slate[400]} />} placeholder="07…" keyboardType="phone-pad" />
        <Text style={[type.label, { color: colors.slate[400], marginTop: spacing.sm, marginBottom: spacing.sm }]}>Emergency contact</Text>
        <Field label="Name" value={ecName} onChangeText={setEcName} icon={<ShieldAlert size={18} color={colors.slate[400]} />} placeholder="Contact name" />
        <Field label="Phone" value={ecPhone} onChangeText={setEcPhone} icon={<Phone size={18} color={colors.slate[400]} />} placeholder="Contact phone" keyboardType="phone-pad" />
        <Field label="Relationship" value={ecRel} onChangeText={setEcRel} icon={<User size={18} color={colors.slate[400]} />} placeholder="e.g. Partner" />
        <Button label="Save changes" loading={saving} onPress={save} fullWidth />
      </Card>

      {/* Vehicle & licence (managed by office) */}
      <Text style={[type.h3, { color: colors.slate[900], marginTop: spacing.xl, marginBottom: spacing.md }]}>Vehicle & licence</Text>
      <Card>
        <ReadOnly icon={<Car size={18} color={colors.primary.DEFAULT} />} label="Vehicle" value={[driver?.vehicle_make_model, driver?.vehicle_registration].filter(Boolean).join(" · ")} />
        <View style={{ height: 1, backgroundColor: colors.slate[100] }} />
        <ReadOnly icon={<IdCard size={18} color={colors.primary.DEFAULT} />} label="Licence number" value={driver?.license_number ?? ""} />
        <View style={{ height: 1, backgroundColor: colors.slate[100] }} />
        <ReadOnly icon={<IdCard size={18} color={colors.amber.DEFAULT} />} label="Licence expires" value={driver?.license_expiry ? formatDate(driver.license_expiry) : ""} />
        <Text style={[type.bodySmall, { color: colors.slate[400], marginTop: spacing.sm }]}>Contact the office to update vehicle or licence details.</Text>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="My ratings" variant="outline" icon={<Star size={18} color={colors.primary.DEFAULT} />} onPress={() => router.push("/ratings")} fullWidth />
      </View>

      <View style={{ marginTop: spacing.md }}>
        <Button label="Sign out" variant="danger" icon={<LogOut size={18} color={colors.white} />} onPress={doSignOut} fullWidth />
      </View>
      <Text style={[type.bodySmall, { color: colors.slate[400], textAlign: "center", marginTop: spacing.lg }]}>Ample Driver v{appVersion}</Text>

      <CameraCapture visible={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={onPhoto} />
    </Screen>
  );
}
