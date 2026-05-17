import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";
import { Users } from "lucide-react";

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
  toolbar?: React.ReactNode;
  pagination?: React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  loading = false,
  loadingMessage = "Loading...",
  emptyIcon = <Users className="h-12 w-12" />,
  emptyMessage = "No records found.",
  toolbar,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px] border-border/60 shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
      {toolbar}
      <div className="flex-1 overflow-auto">
        <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead 
                key={idx} 
                className={col.headerClassName || "py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground"}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-20 text-center">
                <div className="h-10 w-10 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                  {loadingMessage}
                </p>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-20 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-4 opacity-40">
                  {emptyIcon}
                  <p className="text-sm font-bold">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIdx) => (
              <TableRow key={item.id || rowIdx} className="group hover:bg-primary/[0.03] transition-all cursor-default border-b border-border/40">
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx} className={col.cellClassName || "py-5"}>
                    {col.render ? col.render(item) : col.accessor ? String(item[col.accessor]) : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      {pagination}
    </div>
  );
}
