import { cn } from "@/lib/utils";

/** House mark from the Ample Removals brand (purple house, green door/check). */
export function AmpleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* roof */}
      <path
        d="M24 5 6 18.5h6L24 9.5l12 9h6L24 5Z"
        fill="#6b21a8"
      />
      {/* house body */}
      <path
        d="M11 19.5h26V40a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V19.5Z"
        fill="#7e22ce"
      />
      {/* window / check accent */}
      <path
        d="M18.5 28.5l3.2 3.2 7-7"
        stroke="#84cc16"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full lockup: house mark + "Ample Removals" wordmark. */
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
      <AmpleMark className="h-9 w-9 shrink-0" />
      <span className="font-display text-[1.4rem] font-extrabold leading-none tracking-tight">
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
