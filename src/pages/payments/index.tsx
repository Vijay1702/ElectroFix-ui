import { useEffect, useState } from "react";
import { paymentService } from "@/services/finance.service";
import { Plus, Search, Filter, CreditCard, ExternalLink } from "lucide-react";
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
  const limit = 10;

  useEffect(() => {
    fetchPayments();
  }, [page, search]);

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
        title="Payments" 
        description="Record and track all incoming transactions."
        action={
          <Button variant="primary" className="bg-green-600 hover:bg-green-700">
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
                placeholder="Search reference number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4" /> Filter by Method
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref No.</TableHead>
              <TableHead>Invoice Link</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.referenceNumber || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer font-medium">
                      {payment.invoice?.invoiceNumber}
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                      {payment.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                    ${Number(payment.paymentAmount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <Pagination 
          page={page} 
          totalPages={Math.ceil(total / limit)} 
          onPageChange={setPage} 
        />
      </div>
    </div>
  );
}
