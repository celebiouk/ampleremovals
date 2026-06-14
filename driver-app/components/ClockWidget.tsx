import { View, Text } from "react-native";
import { Clock, Coffee, LogOut, Play } from "lucide-react-native";
import { Card, Button, toast } from "@/components/ui";
import { useClock, useClockAction } from "@/hooks/queries";
import { colors, spacing, type } from "@/lib/theme";
import { formatTime } from "@/lib/format";

/** Clock in / out + break controls. Surfaces today's status at a glance. */
export function ClockWidget() {
  const { data, isLoading } = useClock();
  const action = useClockAction();

  const clockedIn = data?.clocked_in ?? false;
  const onBreak = data?.on_break ?? false;

  async function run(a: "clock_in" | "clock_out" | "break_start" | "break_end", label: string) {
    try {
      await action.mutateAsync(a);
      toast.success(label);
    } catch (e) {
      toast.error("Could not update", (e as Error)?.message);
    }
  }

  return (
    <Card accent={clockedIn ? colors.accent.DEFAULT : colors.slate[300]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: clockedIn ? colors.accent.surfaceMid : colors.slate[100], alignItems: "center", justifyContent: "center" }}>
          <Clock size={20} color={clockedIn ? colors.accent.DEFAULT : colors.slate[500]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.h3, { color: colors.slate[900] }]}>
            {isLoading ? "…" : onBreak ? "On break" : clockedIn ? "Clocked in" : "Clocked out"}
          </Text>
          {clockedIn && data?.last_clock_in ? (
            <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Since {formatTime(data.last_clock_in)}</Text>
          ) : (
            <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Tap to start your shift</Text>
          )}
        </View>
      </View>

      {!clockedIn ? (
        <Button label="Clock in" variant="accent" icon={<Play size={18} color={colors.white} />} loading={action.isPending} onPress={() => run("clock_in", "Clocked in")} fullWidth />
      ) : (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {onBreak ? (
            <View style={{ flex: 1 }}>
              <Button label="End break" variant="outline" icon={<Coffee size={18} color={colors.primary.DEFAULT} />} loading={action.isPending} onPress={() => run("break_end", "Break ended")} fullWidth />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Button label="Break" variant="outline" icon={<Coffee size={18} color={colors.primary.DEFAULT} />} loading={action.isPending} onPress={() => run("break_start", "On break")} fullWidth />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Button label="Clock out" variant="danger" icon={<LogOut size={18} color={colors.white} />} loading={action.isPending} onPress={() => run("clock_out", "Clocked out")} fullWidth />
          </View>
        </View>
      )}
    </Card>
  );
}
