import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Package } from "lucide-react-native";
import { Card, Button, Input } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

interface CatalogItem {
  id: string;
  label: string;
  category: string;
  active: boolean;
  created_at: string;
}

/**
 * Admin "Item catalog" — add / hide / remove the extra inventory items that show
 * in the booking wizard alongside the built-in list. Mirrors the web catalog
 * screen; talks to the same /api/admin/catalog endpoints.
 */
export default function CatalogScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("More items");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/catalog");
      const json = await res.json();
      if (json.success) setItems(json.items as CatalogItem[]);
    } catch (e) {
      toast.error("Couldn't load the catalog", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!label.trim() || adding) return;
    setAdding(true);
    try {
      await apiFetch("/api/admin/catalog", {
        method: "POST",
        body: JSON.stringify({ label: label.trim(), category: category.trim() || "More items" }),
      });
      toast.success(`Added "${label.trim()}"`);
      setLabel("");
      load();
    } catch (e) {
      toast.error("Failed to add", e instanceof Error ? e.message : undefined);
    } finally {
      setAdding(false);
    }
  }

  async function toggle(it: CatalogItem) {
    try {
      await apiFetch(`/api/admin/catalog/${it.id}`, { method: "PATCH", body: JSON.stringify({ active: !it.active }) });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, active: !x.active } : x)));
    } catch (e) {
      toast.error("Failed to update", e instanceof Error ? e.message : undefined);
    }
  }

  function remove(it: CatalogItem) {
    Alert.alert("Remove item", `Remove "${it.label}" from the catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/admin/catalog/${it.id}`, { method: "DELETE" });
            setItems((prev) => prev.filter((x) => x.id !== it.id));
            toast.success(`Removed "${it.label}"`);
          } catch (e) {
            toast.error("Failed to remove", e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  }

  // Group admin items by category for display.
  const grouped = items.reduce<Record<string, CatalogItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Item catalog</Text>
      </View>

      <ScrollView contentContainerClassName="p-5 gap-4 pb-12" keyboardShouldPersistTaps="handled">
        <Text className="text-sm text-slate-500">Add items customers can choose in the booking form. They appear straight away.</Text>

        {/* Add form */}
        <Card>
          <View className="gap-3">
            <Input label="Item name" value={label} onChangeText={setLabel} placeholder="e.g. Treadmill" />
            <Input label="Category" value={category} onChangeText={setCategory} placeholder="More items" />
            <Button label={adding ? "Adding…" : "Add item"} icon={<Plus size={18} color="#fff" />} onPress={add} loading={adding} disabled={!label.trim()} />
          </View>
        </Card>

        {/* Items */}
        {loading ? (
          <View className="items-center py-8"><ActivityIndicator color="#7e22ce" /></View>
        ) : items.length === 0 ? (
          <Card>
            <View className="items-center gap-2 py-6">
              <Package size={28} color="#cbd5e1" />
              <Text className="text-center text-sm text-slate-400">No custom items yet. Add one above and it appears in the booking form straight away.</Text>
            </View>
          </Card>
        ) : (
          Object.entries(grouped).map(([cat, list]) => (
            <View key={cat} className="gap-2">
              <Text className="px-1 text-sm font-bold text-brand-purple-800">{cat}</Text>
              <Card className="p-0">
                {list.map((it, i) => (
                  <View key={it.id} className={`flex-row items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                    <Text className={`flex-1 text-sm ${it.active ? "text-slate-800" : "text-slate-400 line-through"}`} numberOfLines={1}>{it.label}</Text>
                    <View className="flex-row items-center gap-1">
                      <Pressable onPress={() => toggle(it)} className="h-9 w-9 items-center justify-center rounded-lg">
                        {it.active ? <Eye size={18} color="#64748b" /> : <EyeOff size={18} color="#94a3b8" />}
                      </Pressable>
                      <Pressable onPress={() => remove(it)} className="h-9 w-9 items-center justify-center rounded-lg">
                        <Trash2 size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
