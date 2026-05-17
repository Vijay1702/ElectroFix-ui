import { useEffect, useState, useMemo } from "react";
import { invoiceService } from "@/services/finance.service";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import { repairService } from "@/services/repair.service";
import { 
  Plus, Search, Eye, Download, 
  Smartphone, Globe, 
  Receipt, X, Zap, 
  Calendar, Fingerprint
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Drawer } from "@/components/shared/Drawer";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import qrScanner from "@/assets/QR_Scanner.png";

export default function InvoicesPage() {
  useAuth();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter] = useState("");

  // Drawer & Form States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [invoiceType, setInvoiceType] = useState<"REPAIR" | "PRODUCT" | "BOTH">("REPAIR");
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QR">("CASH");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    repairJobId: "",
    items: [] as any[],
    paidAmount: 0,
    notes: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInvoices();
  }, [page, search, limit, statusFilter]);

  useEffect(() => {
    if (isDrawerOpen) {
      loadInitialData();
      setErrors({});
    }
  }, [isDrawerOpen]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices(page, limit, search, statusFilter);
      setInvoices(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [custRes, prodRes, repRes] = await Promise.all([
        customerService.getCustomersLookup(),
        productService.getProductsLookup(),
        repairService.getRepairsLookup("COMPLETED")
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setRepairs(repRes.data || []);
    } catch (error) {
      console.error("Failed to load dependency data", error);
    }
  };

  const handleAddItem = (product: any) => {
    const existingItem = formData.items.find(item => item.productId === product.id);
    if (existingItem) {
      const newItems = formData.items.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      );
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ 
        ...formData, 
        items: [
          ...formData.items, 
          { 
            productId: product.id, 
            name: product.name, 
            quantity: 1, 
            unitPrice: product.sellingPrice, 
            totalPrice: product.sellingPrice,
            isRepair: false
          }
        ] 
      });
    }
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    if (item.isRepair) return;
    const newQty = Math.max(1, item.quantity + delta);
    newItems[index] = { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const item = formData.items[index];
    const newItems = formData.items.filter((_, i) => i !== index);
    if (item.isRepair) {
      setFormData({ ...formData, items: newItems, repairJobId: "" });
    } else {
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSelectRepair = (repairId: string) => {
    const repair = repairs.find(r => r.id === repairId);
    if (repair) {
      const repairItem = {
        name: `Repair Job: ${repair.jobNumber} (${repair.brand} ${repair.model})`,
        quantity: 1,
        unitPrice: repair.estimatedCost,
        totalPrice: repair.estimatedCost,
        isRepair: true
      };

      if (invoiceType === "BOTH") {
        const otherItems = formData.items.filter(item => !item.isRepair);
        setFormData({
          ...formData,
          repairJobId: repairId,
          customerId: repair.customerId,
          items: [repairItem, ...otherItems]
        });
      } else {
        setFormData({
          ...formData,
          repairJobId: repairId,
          customerId: repair.customerId,
          items: [repairItem]
        });
      }
    }
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  }, [formData.items]);

  const tax = 0;
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  useEffect(() => {
    if (paymentType === "FULL") {
      setFormData(prev => ({ ...prev, paidAmount: grandTotal }));
    }
  }, [paymentType, grandTotal]);

  const handleFinalize = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (formData.items.length === 0) newErrors.items = "At least one item is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    if (paymentMethod === "QR") {
      setIsQRModalOpen(true);
    } else {
      await executeInvoiceCreation();
    }
  };

  const executeInvoiceCreation = async () => {
    setIsSubmitting(true);
    try {
      const mappedItems = formData.items.map(item => ({
        productId: item.productId || null,
        itemName: item.name,
        itemType: item.isRepair ? "REPAIR" : "PRODUCT",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }));

      await invoiceService.createInvoice({
        customerId: formData.customerId,
        repairJobId: formData.repairJobId || null,
        items: mappedItems,
        subtotal: Number(subtotal),
        tax: Number(tax),
        discount: Number(discount),
        grandTotal: Number(grandTotal),
        paidAmount: Number(formData.paidAmount),
        notes: `Payment Method: ${paymentMethod}. ${formData.notes}`,
        invoiceDate: new Date().toISOString()
      });

      toast.success("Invoice generated successfully");
      setIsDrawerOpen(false);
      setIsQRModalOpen(false);
      fetchInvoices();
      setFormData({ customerId: "", repairJobId: "", items: [], paidAmount: 0, notes: "" });
      setPaymentType("FULL");
      setPaymentMethod("CASH");
    } catch (error: any) {
      console.error("Invoice creation failure", error);
      toast.error(error.response?.data?.message || "Failed to generate official invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const inv = await invoiceService.getInvoiceById(id);
      setSelectedInvoiceForView(inv);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Failed to view invoice:", error);
      toast.error("Failed to fetch invoice details");
    }
  };

  const handleDownloadInvoice = async (inv: any) => {
    setIsDownloading(inv.id);
    try {
      const response = await invoiceService.generatePDF(inv.id);
      
      // We must check if the response is actually a Blob
      // If it's a JSON error, it might be wrapped in a Blob if responseType was 'blob'
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      
      if (blob.size < 1000) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          toast.error(`Server Error: ${json.message || "Failed to generate PDF"}`);
          return;
        } catch (e) {
          // Not JSON, continue with blob
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Force filename with .pdf extension
      const safeInvoiceNum = (inv.invoiceNumber || "Invoice").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${safeInvoiceNum}.pdf`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Safe cleanup
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast.success("Professional PDF Secured");
    } catch (error) {
      toast.error("Failed to generate PDF. System might be busy.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-700 bg-background/50">
      <PageHeader 
        title="Revenue Registry" 
        description="Enterprise-grade billing engine for hardware sales and technical service streams."
        action={
          <Button variant="primary" onClick={() => setIsDrawerOpen(true)} className="rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300">
            <Plus className="h-5 w-5" /> Generate Invoice
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px] border border-border/50 shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-border/50 flex flex-wrap gap-4 items-center justify-between bg-muted/20">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-72 relative group">
              <Input
                type="text"
                placeholder="Search registry..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                className="rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="px-6 py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Invoice ID</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Client Profile</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Date Issued</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Status</TableHead>
              <TableHead className="text-right py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Valuation</TableHead>
              <TableHead className="text-right px-6 py-4 font-black uppercase text-[9px] tracking-[0.2em] text-muted-foreground">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/10"></div>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3 opacity-50">
                    <Receipt className="h-12 w-12" />
                    <p className="text-sm font-bold">No financial records detected.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-primary/[0.02] transition-all cursor-default border-border/30">
                  <TableCell className="px-6 py-5 font-black text-primary text-xs tracking-tight">{inv.invoiceNumber}</TableCell>
                  <TableCell className="py-5">
                    <div className="font-black text-foreground text-sm leading-none mb-1">{inv.customer?.fullName}</div>
                    <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">{inv.customer?.customerCode}</div>
                  </TableCell>
                  <TableCell className="py-5 text-xs font-bold text-muted-foreground tabular-nums">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="py-5">
                    <StatusBadge status={inv.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right py-5 font-black text-foreground tabular-nums text-sm">
                    ₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewInvoice(inv.id)}
                        className="h-9 w-9 flex items-center justify-center bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/5 active:scale-90"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadInvoice(inv)}
                        disabled={isDownloading === inv.id}
                        className="h-9 w-9 flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/5 active:scale-90 disabled:opacity-50"
                      >
                        {isDownloading === inv.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
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

      {/* Invoice Creation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Generate Official Invoice"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-primary tabular-nums">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleFinalize} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Finalize & Pay"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-10 pb-20">
          {/* Invoice Type Selection */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Transaction Type</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "REPAIR", label: "Service Only", icon: Zap },
                { id: "PRODUCT", label: "Product Only", icon: Smartphone },
                { id: "BOTH", label: "Hybrid Bill", icon: Receipt }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setInvoiceType(type.id as any);
                    setFormData({ ...formData, items: [], repairJobId: "" });
                    setErrors({});
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2",
                    invoiceType === type.id 
                      ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-105" 
                      : "border-border/50 bg-muted/5 text-muted-foreground hover:border-border hover:bg-muted/10"
                  )}
                >
                  <type.icon className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dashed">
            {/* Customer Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Billing Participant</label>
              <SearchableSelect
                label="Select Customer"
                options={customers.map(c => ({ value: c.id, label: `${c.fullName} (${c.phoneNumber})` }))}
                value={formData.customerId}
                onChange={(val) => {
                  setFormData({ ...formData, customerId: val });
                  if (errors.customerId) setErrors({ ...errors, customerId: "" });
                }}
                error={errors.customerId}
                required
              />
            </div>

            {/* Repair Job Selection */}
            {(invoiceType === "REPAIR" || invoiceType === "BOTH") && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Linked Service Job</label>
                <SearchableSelect
                  label="Select Completed Repair"
                  options={repairs.map(r => ({ value: r.id, label: `${r.jobNumber} - ${r.brand} ${r.model}` }))}
                  value={formData.repairJobId}
                  onChange={handleSelectRepair}
                  required
                />
              </div>
            )}
          </div>

          {/* Product Selection */}
          {(invoiceType === "PRODUCT" || invoiceType === "BOTH") && (
            <div className="space-y-6 pt-6 border-t border-dashed">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Items</label>
              <div className="relative group">
                <Input
                  placeholder="Search products to add..."
                  className="rounded-2xl pr-12"
                  icon={<Search className="h-4 w-4" />}
                />
                <div className="mt-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {products.filter(p => p.stockQuantity > 0).map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddItem(product)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground uppercase tracking-tight">{product.name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground">Stock: {product.stockQuantity} | ₹{Number(product.sellingPrice).toLocaleString()}</p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-6 pt-6 border-t border-dashed">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Billing Line Items</label>
              <div className="flex items-center gap-4">
                {errors.items && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{errors.items}</span>}
                <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-widest">{formData.items.length} Items</span>
              </div>
            </div>

            <div className="border border-border/50 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">Description</th>
                    <th className="px-4 py-3 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">Qty</th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-xs font-bold text-muted-foreground italic">No items added yet.</td>
                    </tr>
                  ) : (
                    formData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-xs font-black text-foreground leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{item.isRepair ? 'Service' : 'Product'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {!item.isRepair && (
                              <button onClick={() => handleUpdateItemQty(idx, -1)} className="h-6 w-6 rounded-md bg-muted hover:bg-border flex items-center justify-center text-xs">-</button>
                            )}
                            <span className="text-xs font-black tabular-nums">{item.quantity}</span>
                            {!item.isRepair && (
                              <button onClick={() => handleUpdateItemQty(idx, 1)} className="h-6 w-6 rounded-md bg-muted hover:bg-border flex items-center justify-center text-xs">+</button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-black tabular-nums">₹{Number(item.totalPrice).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 p-1"><X className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-8 pt-8 border-t-2 border-dashed">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payment Terms</label>
                <div className="flex p-1 bg-muted/30 rounded-xl gap-1">
                  {["FULL", "PARTIAL"].map((term) => (
                    <button
                      key={term}
                      onClick={() => setPaymentType(term as any)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        paymentType === term ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Collection Mode</label>
                <div className="flex p-1 bg-muted/30 rounded-xl gap-1">
                  {["CASH", "QR"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as any)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        paymentMethod === method ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {paymentType === "PARTIAL" && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Input
                  label="Advance Collected"
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                  icon={<Receipt className="h-4 w-4" />}
                />
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Internal Audit Notes</label>
              <textarea
                className="w-full rounded-2xl border-border/50 bg-muted/5 p-4 text-xs font-medium focus:ring-primary/20 transition-all min-h-[80px]"
                placeholder="Add private memos or settlement specifics..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* Executive Enterprise Audit Drawer */}
      <Drawer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Official Audit Document"
        size="lg"
      >
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
           {selectedInvoiceForView ? (
             <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Executive Header */}
                <div className="px-10 py-10 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-zinc-900/50 dark:to-zinc-950">
                   <div className="flex justify-between items-start mb-10">
                      <div className="space-y-2">
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20 mb-2">
                            <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Financial Record</span>
                         </div>
                         <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {selectedInvoiceForView.invoiceNumber}
                         </h2>
                         <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 opacity-60" /> {new Date(selectedInvoiceForView.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                            <span className="flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5 opacity-60" /> Verified Audit</span>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                         <StatusBadge status={selectedInvoiceForView.paymentStatus} />
                         <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md border border-emerald-100 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                            Authorized
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-10">
                      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Receivable</p>
                         <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">₹{Number(selectedInvoiceForView.grandTotal).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                         <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1.5">Settled</p>
                         <p className="text-xl font-black text-emerald-600 tabular-nums">₹{Number(selectedInvoiceForView.paidAmount).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gateway</p>
                         <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                            {selectedInvoiceForView.notes?.split('Method: ')[1]?.split('.')[0] || 'CASH'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-10 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                   {/* Participant Layout */}
                   <div className="grid grid-cols-2 gap-10">
                      <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl border border-slate-100 dark:border-zinc-800/50">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Bill To</h4>
                         <div className="space-y-3">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{selectedInvoiceForView.customer?.fullName}</p>
                            <div className="space-y-1.5">
                               <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-700">
                                     <Smartphone className="h-3.5 w-3.5 opacity-60" />
                                  </div>
                                  {selectedInvoiceForView.customer?.phoneNumber}
                               </p>
                               <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-700">
                                     <Globe className="h-3.5 w-3.5 opacity-60" />
                                  </div>
                                  {selectedInvoiceForView.customer?.email || 'No email registered'}
                               </p>
                            </div>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl border border-slate-100 dark:border-zinc-800/50">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Merchant</h4>
                         <div className="space-y-3">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">ElectroFix Solutions HQ</p>
                            <div className="space-y-2 pt-1">
                               <div className="inline-flex items-center px-2 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded text-[9px] font-black text-slate-600 dark:text-slate-400">
                                  GSTIN: 33AAAAA0000A1Z5
                               </div>
                               <p className="text-xs font-bold text-slate-500">Service Hub: Chennai, Tamil Nadu</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Ledger Table */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 px-2">
                         <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Service Ledger</h4>
                         <div className="h-px flex-1 bg-slate-100 dark:border-zinc-800"></div>
                      </div>
                      
                      <div className="border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                         <table className="w-full border-collapse">
                            <thead>
                               <tr className="bg-slate-50/80 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800">
                                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Description</th>
                                  <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
                                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                               {selectedInvoiceForView.items?.map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-colors group">
                                     <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{item.itemName}</p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.itemType}</span>
                                     </td>
                                     <td className="px-8 py-6 text-sm font-bold text-slate-500 text-center tabular-nums">{item.quantity}</td>
                                     <td className="px-8 py-6 text-sm font-bold text-slate-500 text-right tabular-nums">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                                     <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white text-right tabular-nums">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* Final Summary Row */}
                   <div className="flex justify-end pr-8 pb-20">
                      <div className="w-72 space-y-4">
                         <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>Subtotal</span>
                            <span className="text-slate-900 dark:text-white tabular-nums">₹{Number(selectedInvoiceForView.subtotal).toLocaleString('en-IN')}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>Tax (Exempt)</span>
                            <span className="text-slate-900 dark:text-white">₹0.00</span>
                         </div>
                         <div className="pt-4 border-t-2 border-slate-100 dark:border-zinc-800">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Audit Total</span>
                               <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                  ₹{Number(selectedInvoiceForView.grandTotal).toLocaleString('en-IN')}
                               </span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Executive Command Bar */}
                <div className="px-10 py-8 border-t border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center relative z-30">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Live Verification Active
                      </p>
                   </div>
                   <div className="flex items-center gap-4">
                      <button 
                         onClick={() => setIsViewModalOpen(false)}
                         className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                      >
                         Discard
                      </button>
                      <Button 
                         variant="primary" 
                         onClick={() => handleDownloadInvoice(selectedInvoiceForView)}
                         disabled={isDownloading === selectedInvoiceForView.id}
                         className="rounded-2xl px-10 h-12 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                      >
                         {isDownloading === selectedInvoiceForView.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                         ) : (
                            <>
                              <Download className="h-4 w-4" /> Export Report
                            </>
                         )}
                      </Button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center bg-slate-50/30">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
             </div>
           )}
        </div>
      </Drawer>

      {/* QR Modal - Classic Design */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="Payment Gateway"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setIsQRModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={executeInvoiceCreation} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Amount Payable</p>
            <h3 className="text-4xl font-black text-primary">₹{formData.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>

          <div className="relative p-8 bg-white rounded-3xl border-2 border-primary/10 shadow-xl group transition-all">
            <img 
              src={qrScanner} 
              alt="QR Code" 
              className="h-64 w-64 object-contain" 
            />
            
            {/* Scan animation overlay - subtle */}
            <div className="absolute inset-8 border-2 border-primary/20 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary/40 blur-sm animate-scan"></div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Scan & Pay securely via any UPI app</p>
          </div>

          <p className="text-[10px] text-muted-foreground text-center max-w-[280px]">
            Please do not close this window until the transaction is confirmed. 
            Official receipt will be generated automatically.
          </p>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
        }
      `}} />
    </div>
  );
}
