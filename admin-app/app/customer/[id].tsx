import { ScrollView, View, Text, Pressable, Linking, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Mail, Phone, ChevronRight, Calendar, MapPin } from "lucide-react-native";
import { Card, Button, StatusBadge, ServiceBadge, Skeleton, ErrorState, EmptyState } from "@/components/ui";
import { useCustomerDetail } from "@/hooks/useCustomers";
import { formatDate } from "@/lib/utils";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useCustomerDetail(id!);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
          {data?.customer.full_name ?? "Customer"}
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-4 p-5"><Skeleton className="h-32" /><Skeleton className="h-40" /></View>
      ) : isError || !data ? (
        <ErrorState message="Couldn't load this customer." onRetry={refetch} />
      ) : (
        <ScrollView
          contentContainerClassName="p-5 gap-4 pb-12"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {/* Profile */}
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-purple-100">
                <Text className="text-xl font-bold text-brand-purple-700">
                  {data.customer.full_name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">{data.customer.full_name}</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  Since {formatDate(data.customer.created_at)}
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {data.customer.phone ? (
                <Button label="Call" variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${data.customer.phone}`)} />
              ) : null}
              {data.customer.email ? (
                <Button label="Email" variant="outline" size="sm" onPress={() => Linking.openURL(`mailto:${data.customer.email}`)} />
              ) : null}
            </View>
            <View className="mt-3 gap-1">
              {data.customer.email ? (
                <View className="flex-row items-center gap-2"><Mail size={14} color="#94a3b8" /><Text className="text-sm text-slate-600 dark:text-slate-300">{data.customer.email}</Text></View>
              ) : null}
              {data.customer.phone ? (
                <View className="flex-row items-center gap-2"><Phone size={14} color="#94a3b8" /><Text className="text-sm text-slate-600 dark:text-slate-300">{data.customer.phone}</Text></View>
              ) : null}
            </View>
          </Card>

          {/* Booking history */}
          <View>
            <Text className="mb-3 px-1 text-base font-semibold text-slate-900 dark:text-white">
              Booking history ({data.bookings.length})
            </Text>
            {data.bookings.length === 0 ? (
              <EmptyState title="No bookings" message="This customer has no bookings yet." />
            ) : (
              <View className="gap-3">
                {data.bookings.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => router.push(`/booking/${b.id}`)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <View className="mb-2 flex-row flex-wrap gap-2">
                          <ServiceBadge service={b.service_type} />
                          <StatusBadge status={b.status} />
                        </View>
                        <Text className="font-mono text-xs text-slate-400">{b.reference}</Text>
                        {b.move_date ? (
                          <View className="mt-1 flex-row items-center gap-1">
                            <Calendar size={12} color="#94a3b8" />
                            <Text className="text-xs text-slate-400">{formatDate(b.move_date)}</Text>
                          </View>
                        ) : null}
                      </View>
                      <ChevronRight size={18} color="#94a3b8" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
