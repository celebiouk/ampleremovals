import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-16">
      {icon ?? <Inbox size={40} color="#94a3b8" />}
      <Text className="mt-4 text-center text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
