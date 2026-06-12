import { useEffect, useState } from "react";
import { paymentService, invoiceService } from "@/services/finance.service";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentsPage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isMonitor = userRole === "MONITOR";

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const [startDate, setStartDate] = useState(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatLocalDate(now));

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
  }, [startDate, endDate]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments(1, 1000, '', startDate, endDate);
      setPayments(res.data);
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

  const columns: Column<any>[] = [
    {
      header: "Reference No.",
      render: (pmt) => (
        <span className="font-semibold text-primary text-sm">{pmt.referenceNumber || 'N/A'}</span>
      )
    },
    {
      header: "Invoice No.",
      render: (pmt) => (
        <span className="font-semibold text-sm text-foreground">{pmt.invoice?.invoiceNumber}</span>
      )
    },
    {
      header: "Customer Name",
      render: (pmt) => (
        <span className="text-sm text-muted-foreground">{pmt.invoice?.customer?.fullName}</span>
      )
    },
    {
      header: "Method",
      render: (pmt) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider">
          <CreditCard className="h-3 w-3" /> {pmt.paymentMethod}
        </span>
      )
    },
    {
      header: "Date",
      render: (pmt) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(pmt.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: "Amount",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (pmt) => (
        <span className="font-semibold text-sm text-green-600 dark:text-green-400 tabular-nums">
          +₹{Number(pmt.paymentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <DataTable
        data={payments}
        columns={columns}
        loading={loading}
        loadingMessage="Loading payments..."
        emptyMessage="No payment transactions found."
        emptyIcon={<CreditCard className="h-12 w-12" />}
        title="Payments & Transactions"
        searchable
        searchPlaceholder="Search by invoice or reference..."
        paginated
        onAddClick={isMonitor ? undefined : handleOpenRecordPayment}
        addLabel="Record Payment"
        toolbarExtra={
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        }
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Client Payment"
        size="md"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button variant="outline" className="flex-1 w-full" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 w-full" 
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
