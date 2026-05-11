import { useEffect, useState } from "react";
import { paymentService } from "@/services/finance.service";
import { Plus, Search, CreditCard, Calendar, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, [page, search, limit]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments(page, limit, search);
      setPayments(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Payments & Transactions" 
        description="Monitor all incoming payments and financial history."
        action={
          <Button variant="primary">
            <Plus className="h-5 w-5" /> Record Payment
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
                placeholder="Search by invoice or reference..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference No.</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No payment transactions found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((pmt) => (
                <TableRow key={pmt.id}>
                  <TableCell className="font-medium text-foreground">{pmt.referenceNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="font-bold text-primary">{pmt.invoice?.invoiceNumber}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{pmt.invoice?.customer?.fullName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                      <CreditCard className="h-3 w-3" /> {pmt.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(pmt.paymentDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      +${Number(pmt.paymentAmount).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
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
