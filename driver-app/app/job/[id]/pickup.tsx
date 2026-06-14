import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui";
import { ChainOfCustodyForm } from "@/components/ChainOfCustodyForm";
import { useJob } from "@/hooks/queries";
import { Skeleton } from "@/components/ui";
import { radius, spacing } from "@/lib/theme";

export default function PickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = useJob(id);

  return (
    <Screen title="Confirm pickup" subtitle={job.data?.reference} back>
      {job.isLoading || !job.data ? (
        <>
          <Skeleton height={100} rounded={radius.xl} style={{ marginBottom: spacing.base }} />
          <Skeleton height={140} rounded={radius.xl} />
        </>
      ) : (
        <ChainOfCustodyForm jobId={job.data.id} reference={job.data.reference} leg="pickup" />
      )}
    </Screen>
  );
}
