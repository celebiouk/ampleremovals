import { MessageCircle } from "lucide-react";
import { WhatsAppQueueList } from "@/components/admin/WhatsAppQueueList";

/**
 * Admin "WhatsApp Queue" — every customer WhatsApp message the system would
 * have sent automatically, waiting for a manual send from the admin's own
 * business WhatsApp (copy the message, or tap WhatsApp for a pre-filled chat).
 */
export default function WhatsAppQueuePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
          <MessageCircle className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950">WhatsApp Queue</h1>
          <p className="text-sm text-slate-500">Copy the message or tap WhatsApp to send it from your own number.</p>
        </div>
      </div>
      <WhatsAppQueueList />
    </div>
  );
}
