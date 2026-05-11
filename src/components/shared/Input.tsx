import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, label, required, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            required={required}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
              error 
                ? "border-destructive focus:border-destructive focus:ring-destructive" 
                : "border-border focus:border-primary focus:ring-primary",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-destructive mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
