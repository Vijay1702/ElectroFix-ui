import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, required, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label required={required}>{label}</Label>}
        <textarea
          ref={ref}
          required={required}
          className={cn(
            "flex w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-1 min-h-[100px] resize-none disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-destructive focus:border-destructive focus:ring-destructive" 
              : "border-border focus:border-primary focus:ring-primary",
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-destructive mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
