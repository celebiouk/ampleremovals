import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { type } from "@/lib/typography";
import { spacing, HIT_SLOP, MIN_TOUCH } from "@/lib/tokens";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Optional right-aligned element (icon button / text action). */
  right?: React.ReactNode;
}

/** 56px stack-screen header with a back chevron + title. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <View
      style={{
        height: 56, flexDirection: "row", alignItems: "center",
        paddingHorizontal: spacing.sm, gap: spacing.xs,
        backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.separator,
      }}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" }}
      >
        <ChevronLeft size={26} color={theme.primary} />
      </Pressable>
      <Text style={[type.h3, { flex: 1, color: theme.text }]} numberOfLines={1}>{title}</Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
