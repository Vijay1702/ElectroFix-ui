import { Info } from "lucide-react";

interface InfoCalloutProps {
  children: React.ReactNode;
}

// A quiet, non-blocking informational note inside a form/drawer — e.g. explaining
// a side effect of saving. Not for errors/warnings; use ConfirmDialog or an
// error message for those.
export function InfoCallout({ children }: InfoCalloutProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200/60 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/30">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
      <p className="text-xs leading-relaxed text-blue-900/80 dark:text-blue-200/80">{children}</p>
    </div>
  );
}
