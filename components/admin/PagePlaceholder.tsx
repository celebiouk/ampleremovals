import type { LucideIcon } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  phase = "Phase 4",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-purple-50 text-brand-purple-800">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {title} coming in {phase}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The data, schema and authentication are ready. This view will be built
          out in {phase}.
        </p>
      </div>
    </div>
  );
}

export default PagePlaceholder;
