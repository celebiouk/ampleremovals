import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <AlertCircle size={40} color="#dc2626" />
      <Text className="mt-4 text-center text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <View className="mt-4">
          <Button label="Try again" variant="outline" size="sm" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
