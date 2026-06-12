import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";
import { Users, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string | React.ReactNode;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  loadingMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;

  // Integrated card header
  title?: string;
  onAddClick?: () => void;
  addLabel?: string;

  // Built-in search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];

  // Built-in pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  // Extra toolbar content (filters etc.) appended after search
  toolbarExtra?: React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  loading = false,
  loadingMessage = "Loading...",
  emptyIcon = <Users className="h-12 w-12" />,
  emptyMessage = "No records found.",
  title,
  onAddClick,
  addLabel = "Add New",
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys,
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  toolbarExtra,
}: DataTableProps<T>) {

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();

    const deepSearch = (val: any): boolean => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') {
        return Object.values(val).some(deepSearch);
      }
      return String(val).toLowerCase().includes(q);
    };

    return data.filter((item) => {
      if (searchKeys) {
        return searchKeys.some((key) => deepSearch(item[key]));
      }
      return deepSearch(item);
    });
  }, [data, search, searchKeys]);

  // --- Client-side pagination ---
  const totalPages = paginated ? Math.max(1, Math.ceil(filteredData.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pagedData = paginated
    ? filteredData.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filteredData;

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  // --- Page number array with ellipsis ---
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col">

      {/* ── Card Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/40">
        {/* Title */}
        <div className="flex items-center gap-2">
          {title && (
            <h2 className="text-base font-semibold text-foreground">
              {title}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                ({filteredData.length})
              </span>
            </h2>
          )}
        </div>

        {/* Right controls: search + add */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-8 pr-2 rounded-xl border border-border/60 bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all w-40 sm:w-48 placeholder:text-muted-foreground"
              />
            </div>
          )}

          {toolbarExtra}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl border border-primary/60 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.headerClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-20 text-center">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{loadingMessage}</p>
                </TableCell>
              </TableRow>
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    {emptyIcon}
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((item, rowIdx) => (
                <TableRow key={item.id ?? rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={col.cellClassName}>
                      {col.render
                        ? col.render(item)
                        : col.accessor
                        ? String(item[col.accessor] ?? "")
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────── */}
      {paginated && !loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border/20 bg-muted/5">
          {/* Records per page */}
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSize(Number(e.target.value))}
              className="h-8 rounded-lg border border-border/60 bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground font-medium">Record(s) per page</span>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((num, idx) =>
              num === "..." ? (
                <span key={`e-${idx}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">
                  …
                </span>
              ) : (
                <button
                  key={`p-${num}`}
                  onClick={() => setPage(Number(num))}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors",
                    num === safePage
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  )}
                >
                  {num}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
