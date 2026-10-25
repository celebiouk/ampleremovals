import { Suspense } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Pixels />
      <AttributionCapture />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
