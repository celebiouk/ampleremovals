import { DriverJobsList } from "@/components/drivers/DriverJobsList";

export default function DriverTodayJobsPage() {
  return (
    <DriverJobsList
      initialTab="today"
      title="Today's Jobs"
      subtitle="Jobs scheduled for today"
      hideTabs
      emptyMessage="No jobs scheduled for today."
    />
  );
}
