import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ page, totalPages, limit = 10, onPageChange, onLimitChange }: PaginationProps) {
  const safeTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-muted/5 border-t">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rows per page:</span>
            <select 
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-background border border-border rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary transition-colors"
            >
              {[5, 10, 25, 50].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{safeTotalPages}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          className="h-8 px-2"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
