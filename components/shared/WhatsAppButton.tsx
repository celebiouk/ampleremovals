const WHATSAPP_NUMBER = "447344683477"; // +44 7344 683477, digits only for wa.me

interface Props {
  message: string;
  className?: string;
  variant?: "solid" | "outline";
}

/**
 * Opens WhatsApp with a pre-filled message naming the service + village the
 * visitor came from (plus the page URL), so a reply like "check this photo"
 * still carries full context — no guessing which page a lead landed on.
 */
export function WhatsAppButton({ message, className = "", variant = "solid" }: Props) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const base = "inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors";
  const styles = variant === "solid"
    ? "bg-[#25D366] text-white hover:bg-[#1ebe57]"
    : "border border-white text-white hover:bg-white/10";

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12.004 2C6.486 2 2 6.486 2 12.004c0 1.908.531 3.75 1.537 5.37L2 22l4.75-1.5a9.953 9.953 0 0 0 5.254 1.5c5.518 0 10.004-4.486 10.004-10.004S17.522 2 12.004 2zm0 18.17a8.16 8.16 0 0 1-4.168-1.14l-.3-.178-2.826.893.904-2.75-.195-.283A8.166 8.166 0 1 1 20.17 12.17a8.175 8.175 0 0 1-8.166 8z" />
      </svg>
      WhatsApp us
    </a>
  );
}
