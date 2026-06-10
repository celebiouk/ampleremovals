import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/colors";
import { fonts } from "@/lib/typography";

type Size = "sm" | "md" | "lg" | "xl";
const DIM: Record<Size, number> = { sm: 32, md: 40, lg: 56, xl: 80 };
const FONT: Record<Size, number> = { sm: 13, md: 16, lg: 22, xl: 30 };

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: Size;
  /** Coloured status ring around the avatar. */
  ring?: string;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({ name, uri, size = "md", ring }: AvatarProps) {
  const dim = DIM[size];
  const inner = (
    <View style={{ width: dim, height: dim, borderRadius: dim / 2, overflow: "hidden" }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: dim, height: dim }} contentFit="cover" transition={150} />
      ) : (
        <LinearGradient
          colors={[colors.primary.light, colors.primary.DEFAULT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: FONT[size] }}>
            {initials(name)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );

  if (!ring) return inner;
  return (
    <View style={{ padding: 2, borderRadius: (dim + 4) / 2, borderWidth: 2, borderColor: ring }}>
      {inner}
    </View>
  );
}
