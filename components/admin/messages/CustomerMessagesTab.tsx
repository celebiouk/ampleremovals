"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ConversationView } from "./ConversationView";

/** The "Messages" tab on a customer profile — resolves/creates their conversation
 *  then embeds the shared chat view. */
export function CustomerMessagesTab({ customerId }: { customerId: string }) {
  const [state, setState] = useState<{ loading: boolean; hasPhone: boolean; conversationId: string | null; contactPhone: string | null }>({
    loading: true, hasPhone: true, conversationId: null, contactPhone: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/customers/${customerId}/conversation`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j.success) setState({ loading: false, hasPhone: j.hasPhone, conversationId: j.conversationId, contactPhone: j.contactPhone ?? null }); })
      .catch(() => { if (!cancelled) setState((s) => ({ ...s, loading: false })); });
    return () => { cancelled = true; };
  }, [customerId]);

  if (state.loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (!state.hasPhone) {
    return <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">This customer has no phone number on file, so there&apos;s no SMS/WhatsApp conversation.</div>;
  }
  return (
    <div className="h-[calc(100vh-18rem)] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ConversationView conversationId={state.conversationId} contactPhone={state.contactPhone} />
    </div>
  );
}
