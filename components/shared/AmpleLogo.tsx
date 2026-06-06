import Image from "next/image";
import { cn } from "@/lib/utils";

/** Full lockup: logo image + "Ample Removals" wordmark. */
export function AmpleLogo({
  className,
  variant = "color",
}: {
  className?: string;
  /** "color" for light backgrounds, "white" for dark/purple backgrounds. */
  variant?: "color" | "white";
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt="Ample Removals logo"
        height={50}
        width={50}
        className="shrink-0 object-contain"
        priority
      />
      <span className="font-display text-[1.68rem] font-extrabold leading-none tracking-tight">
        <span className={variant === "white" ? "text-white" : "text-brand-purple-800"}>
          Ample
        </span>{" "}
        <span className={variant === "white" ? "text-brand-green-400" : "text-brand-green-600"}>
          Removals
        </span>
      </span>
    </span>
  );
}

export default AmpleLogo;
