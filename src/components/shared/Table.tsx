import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="flex-1 overflow-x-auto w-full">
      <table className={cn("w-full text-sm text-left", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead className={cn("text-xs uppercase bg-muted/50 text-muted-foreground", className)} {...props} />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("bg-background hover:bg-muted/30 transition-colors", className)} {...props} />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("px-6 py-4 font-medium", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-6 py-4", className)} {...props} />;
}
