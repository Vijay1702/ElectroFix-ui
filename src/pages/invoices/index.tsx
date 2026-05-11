import { useEffect, useState } from "react";
import { invoiceService } from "@/services/finance.service";
import { Plus, Search, Filter, FileText, Eye, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchInvoices();
  }, [page, search, limit]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices(page, limit, search);
      setInvoices(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Billing & Invoices" 
        description="Manage customer billing, invoices, and payment statuses."
        action={
          <Button variant="primary">
            <Plus className="h-5 w-5" /> Create Invoice
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-72">
              <Input
                type="text"
                placeholder="Search invoice number or customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4" /> Filter by Status
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{inv.customer?.fullName}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Code: {inv.customer?.customerCode}</div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                    ${Number(inv.grandTotal).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination 
          page={page} 
          totalPages={Math.ceil(total / limit)} 
          limit={limit}
          onPageChange={setPage} 
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>
    </div>
  );
}
