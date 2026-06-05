import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Booking Received",
};

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const reference = searchParams.ref;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-brand-purple-50 px-6 pt-20">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Thank you — we&apos;ve got your request
        </h1>
        <p className="mt-3 text-muted-foreground">
          Our team will review your details and be in touch shortly to confirm
          your quote and answer any questions.
        </p>

        {reference && (
          <div className="mt-6 rounded-xl bg-brand-purple-50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Your reference</p>
            <p className="font-display text-xl font-bold tracking-wider text-brand-purple-800">
              {reference}
            </p>
          </div>
        )}

        <Button
          asChild
          className="mt-8 bg-brand-purple-800 text-white hover:bg-brand-purple-900"
        >
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
