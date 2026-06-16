import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Pixels />
      <AttributionCapture />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
