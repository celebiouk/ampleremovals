import { useCallback, useState } from "react";
import {
  ScrollView, View, Text, Pressable, Modal, Alert, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus, Shield, ShieldCheck, X } from "lucide-react-native";
import { Button, Input, Badge, EmptyState } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { AdminUser, AdminActivityLog, AdminRole } from "@/types";

export default function ManageAdminsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, a] = await Promise.all([
        apiFetch<{ success: boolean; users: AdminUser[] }>("/api/admin/users"),
        apiFetch<{ success: boolean; logs: AdminActivityLog[] }>("/api/admin/activity?limit=25"),
      ]);
      setUsers(u.users ?? []);
      setLogs(a.logs ?? []);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load admins");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function rowActions(user: AdminUser) {
    const actions: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [
      {
        text: user.is_active === false ? "Activate" : "Deactivate",
        onPress: () => toggleActive(user),
      },
      { text: "Delete", style: "destructive", onPress: () => confirmDelete(user) },
      { text: "Cancel", style: "cancel" },
    ];
    Alert.alert(user.full_name || user.email, user.email, actions);
  }

  async function toggleActive(user: AdminUser) {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: user.is_active === false }),
      });
      load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update");
    }
  }

  function confirmDelete(user: AdminUser) {
    Alert.alert("Delete admin", `Permanently delete ${user.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            load();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to delete");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#7e22ce" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">Manage Admins</Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          className="flex-row items-center gap-1 rounded-xl bg-brand-purple-800 px-3 py-2"
        >
          <Plus size={16} color="#fff" />
          <Text className="text-sm font-semibold text-white">Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7e22ce" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="p-4 gap-3 pb-12"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
        >
          {/* Admin list */}
          {users.length === 0 ? (
            <EmptyState title="No admins" message="Add your first admin user." />
          ) : (
            users.map((u) => (
              <Pressable
                key={u.id}
                onLongPress={() => rowActions(u)}
                onPress={() => rowActions(u)}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-purple-100">
                  {u.role === "super_admin" ? (
                    <ShieldCheck size={20} color="#7e22ce" />
                  ) : (
                    <Shield size={20} color="#7e22ce" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {u.full_name || u.email}
                  </Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">{u.email}</Text>
                </View>
                <View className="items-end gap-1">
                  <Badge
                    label={u.role === "super_admin" ? "Super" : "Admin"}
                    colour="bg-brand-purple-100 text-brand-purple-800"
                  />
                  {u.is_active === false ? (
                    <Badge label="Inactive" colour="bg-slate-100 text-slate-500" />
                  ) : null}
                </View>
              </Pressable>
            ))
          )}

          {/* Activity feed */}
          <Text className="mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Recent activity
          </Text>
          {logs.length === 0 ? (
            <Text className="px-1 text-sm text-slate-500">No activity yet.</Text>
          ) : (
            <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {logs.map((log, i) => (
                <View
                  key={log.id}
                  className={`px-4 py-3 ${i === 0 ? "" : "border-t border-slate-100 dark:border-slate-800"}`}
                >
                  <Text className="text-sm text-slate-900 dark:text-white">{log.action}</Text>
                  <Text className="mt-0.5 text-xs text-slate-400">
                    {log.admin_user?.full_name || log.admin_email} · {formatDateTime(log.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <CreateAdminModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />
    </SafeAreaView>
  );
}

function CreateAdminModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!email || !fullName || password.length < 8) {
      Alert.alert("Missing info", "Enter a name, email, and a password of at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, full_name: fullName, password, role }),
      });
      setEmail(""); setFullName(""); setPassword(""); setRole("admin");
      onCreated();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">New Admin</Text>
          <Pressable onPress={onClose} className="p-1">
            <X size={24} color="#94a3b8" />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="p-4 gap-4">
          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@ampleremovals.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Temporary password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            secureTextEntry
          />
          <View>
            <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Role</Text>
            <View className="flex-row gap-2">
              {(["admin", "super_admin"] as AdminRole[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  className={`flex-1 items-center rounded-xl border py-3 ${
                    role === r
                      ? "border-brand-purple-600 bg-brand-purple-50"
                      : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      role === r ? "text-brand-purple-800" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {r === "super_admin" ? "Super Admin" : "Admin"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Button label="Create admin" onPress={create} loading={saving} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
