import { Lock } from "lucide-react";
import { Label } from "./Label";

interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
}

// For displaying non-editable reference data inside a form/drawer (e.g. the
// record's name/ID above its actually-editable fields) — visually distinct
// from Input so it reads as "shown, not editable" rather than a disabled input.
export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="w-full">
      <Label>{label}</Label>
      <div className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
