import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Download, FileText, AlertCircle } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface TaxDocument {
  id: string;
  name: string;
  description: string;
  available: boolean;
  type: string;
  generatedDate: string;
}

interface TaxYear {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  estimated_tax: number;
  estimated_ni: number;
  payslip_count: number;
}

export default function TaxDocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [taxYear, setTaxYear] = useState<TaxYear | null>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiFetch("/api/worker/tax-documents");
        const data = await response.json();

        if (data.success) {
          setDocuments(data.available_documents);
          setTaxYear(data.tax_year);
          setWorker(data.worker);
        }
      } catch (e) {
        console.error("Failed to fetch tax documents:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDownload = (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    console.log(`Downloading ${docId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 100, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Tax Documents" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Worker info */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50] }}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Your Information
            </Text>
            <View style={{ gap: spacing.sm }}>
              <View>
                <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Name</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                  {worker?.name}
                </Text>
              </View>
              <View>
                <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Email</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                  {worker?.email}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Tax year summary */}
        {taxYear && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginBottom: spacing.base }]}>
                Tax Year {taxYear.year}
              </Text>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Gross</Text>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    {formatCurrency(taxYear.ytd_gross)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Net</Text>
                  <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>
                    {formatCurrency(taxYear.ytd_net)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Est. Tax</Text>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    {formatCurrency(taxYear.estimated_tax)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Est. NI</Text>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    {formatCurrency(taxYear.estimated_ni)}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Documents list */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Available Documents
          </Text>
          <FlatList
            scrollEnabled={false}
            data={documents}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) => (
              <Card
                style={{
                  padding: spacing.base,
                  opacity: item.available ? 1 : 0.6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.base }}>
                  <FileText
                    size={24}
                    color={item.available ? colors.primary.DEFAULT : colors.slate[400]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {item.name}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                {item.available && (
                  <Pressable
                    onPress={() => handleDownload(item.id)}
                    style={{
                      padding: spacing.sm,
                      borderRadius: 8,
                      backgroundColor: colors.primary.DEFAULT,
                    }}
                  >
                    <Download size={18} color={colors.white} />
                  </Pressable>
                )}
              </Card>
            )}
          />
        </Animated.View>

        {/* Info notice */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card style={{ padding: spacing.base, backgroundColor: "#fef3c7", borderLeftWidth: 4, borderLeftColor: "#f59e0b" }}>
            <View style={{ flexDirection: "row", gap: spacing.base, alignItems: "flex-start" }}>
              <AlertCircle size={20} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: "#92400e", marginBottom: spacing.xs }]}>
                  Tax Document Information
                </Text>
                <Text style={[type.bodySmall, { color: "#b45309" }]}>
                  These documents are for your personal records and tax purposes. Contact us if you need corrections.
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
