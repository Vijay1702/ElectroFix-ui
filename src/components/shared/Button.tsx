import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:opacity-90 border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
      outline: "bg-transparent border-border hover:bg-muted text-foreground",
      ghost: "bg-transparent border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
      danger: "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-11 px-5 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
      icon: "p-2 rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
