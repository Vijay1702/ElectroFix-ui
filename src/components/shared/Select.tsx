import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

// For short, static option lists inside a form (e.g. Adjustment Type, Call Outcome).
// Matches Input's exact chrome. For long/searchable lists (customers, products, etc.)
// use SearchableSelect instead.
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, label, required, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            required={required}
            className={cn(
              "flex h-11 w-full appearance-none rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : "border-border focus:border-primary focus:ring-primary",
              icon && "pl-10",
              "pr-10",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {error && <p className="text-[10px] text-destructive mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
