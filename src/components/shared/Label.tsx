import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ children, required, className, ...props }: LabelProps) => {
  return (
    <label
      className={cn(
        "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive font-bold text-sm normal-case">*</span>}
    </label>
  );
};
