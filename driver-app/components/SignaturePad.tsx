import { useRef } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import { X } from "lucide-react-native";
import { colors, spacing, type } from "@/lib/theme";

/** Full-screen signature capture. Returns a PNG data-URL via onOK. */
export function SignaturePad({
  visible, onClose, onOK, name,
}: { visible: boolean; onClose: () => void; onOK: (dataUrl: string) => void; name?: string }) {
  const ref = useRef<SignatureViewRef>(null);

  // Hide the library's default footer; we drive Clear/Save with our own buttons.
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; margin: 0; }
    body, html { background-color: #ffffff; }
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={[type.h2, { color: colors.slate[900] }]}>Signature</Text>
            {name ? <Text style={[type.body, { color: colors.slate[500] }]}>{name}, please sign below</Text> : null}
          </View>
          <Pressable onPress={onClose} hitSlop={12}><X size={26} color={colors.slate[500] } /></Pressable>
        </View>

        <View style={{ flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.slate[200], borderRadius: 16, overflow: "hidden" }}>
          <SignatureScreen
            ref={ref}
            onOK={(sig) => onOK(sig)}
            webStyle={webStyle}
            backgroundColor="#ffffff"
            penColor="#0f172a"
            descriptionText=""
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 40 }}>
          <Pressable
            onPress={() => ref.current?.clearSignature()}
            style={{ flex: 1, height: 54, borderRadius: 16, borderWidth: 2, borderColor: colors.slate[300], alignItems: "center", justifyContent: "center" }}
          >
            <Text style={[type.button, { color: colors.slate[700] }]}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={() => ref.current?.readSignature()}
            style={{ flex: 2, height: 54, borderRadius: 16, backgroundColor: colors.primary.DEFAULT, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={[type.button, { color: colors.white }]}>Save signature</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
