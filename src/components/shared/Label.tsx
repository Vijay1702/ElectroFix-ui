import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ children, required, className, ...props }: LabelProps) => {
  return (
    <label 
      className={cn("text-xs font-semibold flex items-center gap-1 mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive font-bold text-sm">*</span>}
    </label>
  );
};
