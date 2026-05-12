import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  required,
  error,
  className,
  disabled,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("w-full space-y-1.5", className)} ref={containerRef}>
      {label && <Label required={required}>{label}</Label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border bg-background px-4 py-2 text-sm outline-none transition-all focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
            error 
              ? "border-destructive focus:border-destructive focus:ring-destructive" 
              : "border-border focus:border-primary focus:ring-primary",
            isOpen && "border-primary ring-1 ring-primary"
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center border-b px-3 bg-muted/5">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  className="flex h-10 w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary text-left",
                        value === option.value ? "bg-primary/5 text-primary font-semibold" : "text-foreground"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {value === option.value && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
    </div>
  );
}
