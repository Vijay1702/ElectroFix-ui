import { useGlobalLoaderStore } from "@/stores/global-loader.store";
import { Loader2 } from "lucide-react";

export function GlobalLoader() {
  const isLoading = useGlobalLoaderStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card shadow-2xl border">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Processing...</p>
      </div>
    </div>
  );
}
