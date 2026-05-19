import { useEffect, useState } from "react";
import { paymentService, invoiceService } from "@/services/finance.service";
import { Plus, Search, CreditCard, Calendar, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenRecordPayment = async () => {
    setIsModalOpen(true);
    try {
      const res = await invoiceService.getInvoices(1, 100, "", "");
      const pending = res.data.filter((inv: any) => inv.paymentStatus !== "PAID");
      setUnpaidInvoices(pending);
    } catch (err) {
      console.error("Failed to load unpaid invoices", err);
    }
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = unpaidInvoices.find(i => i.id === id);
    if (inv) {
      setPaymentAmount(Number(inv.pendingAmount || 0));
    } else {
      setPaymentAmount(0);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error("Please select an invoice");
      return;
    }
    const inv = unpaidInvoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return;

    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    
    if (paymentAmount > Number(inv.pendingAmount || 0)) {
      toast.error(`Payment amount cannot exceed remaining balance of ₹${Number(inv.pendingAmount).toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.createPayment({
        invoiceId: selectedInvoiceId,
        paymentAmount: Number(paymentAmount),
        paymentMethod,
        paymentDate: new Date().toISOString(),
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined
      });

      toast.success("Payment recorded successfully!");
      setIsModalOpen(false);
      fetchPayments();
      setSelectedInvoiceId("");
      setPaymentAmount(0);
      setPaymentMethod("cash");
      setReferenceNumber("");
      setNotes("");
    } catch (err: any) {
      console.error("Failed to record payment", err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Payments & Transactions" 
        description="Monitor all incoming payments and financial history."
        action={
          <Button variant="primary" onClick={handleOpenRecordPayment}>
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
                      +₹{Number(pmt.paymentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Client Payment"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={handleRecordPaymentSubmit} 
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Select Unpaid/Partial Invoice</label>
            <SearchableSelect
              label="Select Invoice"
              options={unpaidInvoices.map(inv => ({ 
                value: inv.id, 
                label: `${inv.invoiceNumber} - ${inv.customer?.fullName} (Bal: ₹${Number(inv.pendingAmount).toLocaleString()})` 
              }))}
              value={selectedInvoiceId}
              onChange={handleSelectInvoice}
              required
            />
          </div>

          {(() => {
            const activeInv = unpaidInvoices.find(i => i.id === selectedInvoiceId);
            if (!activeInv) return null;
            return (
              <div className="p-4 rounded-2xl bg-muted/10 border border-border/50 space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Client</span>
                  <span className="text-xs font-black text-foreground">{activeInv.customer?.fullName}</span>
                </div>
                <div className="h-px bg-border/50 my-1" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xs font-bold font-mono text-foreground">₹{Number(activeInv.grandTotal).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Paid</p>
                    <p className="text-xs font-bold font-mono text-emerald-400">₹{Number(activeInv.paidAmount).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Balance</p>
                    <p className="text-xs font-bold font-mono text-amber-400">₹{Number(activeInv.pendingAmount).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedInvoiceId && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Input
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                icon={<span>₹</span>}
                required
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payment Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "cash", label: "Cash" },
                    { id: "card", label: "Card" },
                    { id: "upi", label: "UPI" },
                    { id: "bank_transfer", label: "Bank" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={cn(
                        "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200",
                        paymentMethod === mode.id 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border/50 bg-muted/5 text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== "cash" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <Input
                    label="Reference / Transaction Number"
                    placeholder="Enter TXN ID, Cheque No, etc..."
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Notes</label>
                <textarea
                  className="w-full rounded-2xl border-border/50 bg-muted/5 p-4 text-xs font-medium focus:ring-primary/20 transition-all min-h-[80px]"
                  placeholder="Memo or settlement specifics..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
