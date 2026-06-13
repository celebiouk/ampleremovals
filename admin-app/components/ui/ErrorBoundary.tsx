import { ReactNode, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { AlertCircle, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.slate[50] }} contentContainerStyle={{ padding: spacing.base, justifyContent: "center" }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.danger.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <AlertCircle size={32} color={colors.danger.DEFAULT} />
          </View>
          <Text style={[type.h2, { color: colors.slate[900], marginBottom: spacing.base, textAlign: "center" }]}>
            Something went wrong
          </Text>
          <Text style={[type.body, { color: colors.slate[600], marginBottom: spacing.lg, textAlign: "center" }]}>
            {error.message || "An unexpected error occurred"}
          </Text>
          <Button
            label="Try again"
            variant="accent"
            size="lg"
            icon={<RotateCcw size={20} color={colors.white} />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setError(null);
            }}
          />
        </View>
      </ScrollView>
    );
  }

  return <>{children}</>;
}
