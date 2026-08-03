import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ page, totalPages, limit = 10, onPageChange, onLimitChange }: PaginationProps) {
  const safeTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;

  // Generate page numbers array with ellipses where appropriate
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", safeTotalPages);
      } else if (page >= safeTotalPages - 3) {
        pages.push(1, "...", safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", safeTotalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-transparent border-t border-border/20">
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <>
            <select 
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:border-primary transition-all font-semibold"
            >
              {[5, 10, 25, 50].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground font-medium">Record(s) per page</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((num, idx) => {
          if (num === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">
                ...
              </span>
            );
          }
          const isActive = num === page;
          return (
            <button
              key={`page-${num}`}
              onClick={() => onPageChange(Number(num))}
              className={cn(
                "h-8 w-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
              )}
            >
              {num}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/10 rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
