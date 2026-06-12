import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="flex-1 overflow-x-auto w-full">
      <table className={cn("w-full text-sm text-left border-collapse", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead className={cn("text-xs text-muted-foreground bg-muted/30 border-b border-border/40", className)} {...props} />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("border-b border-border/20 hover:bg-muted/20 transition-colors", className)} {...props} />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("px-4 py-2 font-semibold text-muted-foreground text-left align-middle whitespace-nowrap", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-2 align-middle text-sm text-foreground", className)} {...props} />;
}
