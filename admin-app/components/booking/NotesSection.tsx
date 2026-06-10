import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Trash2, Plus } from "lucide-react-native";
import { Card, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { NoteRow } from "@/hooks/useBookingDetail";

export function NotesSection({
  bookingId,
  notes,
  onChanged,
}: {
  bookingId: string;
  notes: NoteRow[];
  onChanged: () => void;
}) {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (text.trim().length < 3) return;
    setAdding(true);
    try {
      const { error } = await supabase
        .from("booking_notes")
        .insert({ booking_id: bookingId, note: text.trim(), created_by: "admin" });
      if (error) throw error;
      await supabase.from("activity_log").insert({
        booking_id: bookingId,
        action: "Note added",
        metadata: { note_preview: text.slice(0, 80) },
        performed_by: "admin",
      });
      setText("");
      onChanged();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setAdding(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert("Delete note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.from("booking_notes").delete().eq("id", id);
            await supabase.from("activity_log").insert({
              booking_id: bookingId, action: "Note deleted", metadata: {}, performed_by: "admin",
            });
            onChanged();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to delete");
          }
        },
      },
    ]);
  }

  return (
    <Card>
      <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Internal notes</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Add a note…"
        placeholderTextColor="#94a3b8"
        multiline
        className="mb-2 min-h-[70px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        textAlignVertical="top"
      />
      <View className="mb-3 flex-row justify-end">
        <Button
          label="Add note"
          size="sm"
          variant="secondary"
          loading={adding}
          disabled={text.trim().length < 3}
          onPress={add}
        />
      </View>

      {notes.length === 0 ? (
        <Text className="text-sm text-slate-500">No notes yet.</Text>
      ) : (
        <View className="gap-2">
          {notes.map((n) => (
            <View key={n.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm text-slate-800 dark:text-slate-100">{n.note}</Text>
                <Pressable onPress={() => confirmDelete(n.id)} hitSlop={8}>
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              </View>
              <Text className="mt-1 text-xs text-slate-400">
                {n.created_by ?? "admin"} · {formatDateTime(n.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
