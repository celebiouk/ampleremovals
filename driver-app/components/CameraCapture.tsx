import { useRef, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X, Camera as CameraIcon, RefreshCw } from "lucide-react-native";
import { colors, spacing, type } from "@/lib/theme";
import { Button } from "./ui";

/** Full-screen camera modal. Returns the captured photo URI via onCapture. */
export function CameraCapture({
  visible, onClose, onCapture,
}: { visible: boolean; onClose: () => void; onCapture: (uri: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function snap() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        {!permission?.granted ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.base }}>
            <CameraIcon size={48} color={colors.white} />
            <Text style={[type.h3, { color: colors.white, textAlign: "center" }]}>Camera access needed</Text>
            <Text style={[type.body, { color: colors.slate[300], textAlign: "center" }]}>We use the camera to photograph the load as proof of condition.</Text>
            <Button label="Grant access" onPress={requestPermission} />
            <Pressable onPress={onClose}><Text style={[type.body, { color: colors.slate[400] }]}>Cancel</Text></Pressable>
          </View>
        ) : (
          <>
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
            {/* Top bar */}
            <View style={{ position: "absolute", top: 56, left: spacing.lg, right: spacing.lg, flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable onPress={onClose} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
                <X size={24} color={colors.white} />
              </Pressable>
              <Pressable onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={22} color={colors.white} />
              </Pressable>
            </View>
            {/* Shutter */}
            <View style={{ position: "absolute", bottom: 48, left: 0, right: 0, alignItems: "center" }}>
              <Pressable onPress={snap} disabled={busy} style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" }}>
                  {busy ? <ActivityIndicator color={colors.primary.DEFAULT} /> : null}
                </View>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
