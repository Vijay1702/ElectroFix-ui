import { useEffect, useState, useMemo } from "react";
import { invoiceService } from "@/services/finance.service";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import { repairService } from "@/services/repair.service";
import { 
  Plus, Search, FileText, Eye, Download, 
  Trash2, PlusCircle, MinusCircle, User, 
  Box, Wrench, CreditCard 
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Drawer } from "@/components/shared/Drawer";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role?.name === "ADMIN";

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  // Drawer & Form States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"REPAIR" | "PRODUCT" | "BOTH">("REPAIR");
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
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

  useEffect(() => {
    fetchInvoices();
  }, [page, search, limit, statusFilter]);

  useEffect(() => {
    if (isDrawerOpen) {
      loadInitialData();
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
        customerService.getCustomers(1, 100),
        productService.getProducts(1, 100),
        repairService.getRepairs(1, 100, "", "COMPLETED")
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
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [formData.items]);

  const tax = 0;
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  // Sync paidAmount if paymentType is FULL
  useEffect(() => {
    if (paymentType === "FULL") {
      setFormData(prev => ({ ...prev, paidAmount: grandTotal }));
    }
  }, [paymentType, grandTotal]);

  const handleSubmit = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      toast.error("Please select a customer and add at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const mappedItems = formData.items.map(item => ({
        productId: item.productId || null,
        itemName: item.name,
        itemType: item.isRepair ? "REPAIR" : "PRODUCT",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));

      await invoiceService.createInvoice({
        customerId: formData.customerId,
        repairJobId: formData.repairJobId || null,
        items: mappedItems,
        subtotal,
        tax,
        discount,
        grandTotal,
        paidAmount: formData.paidAmount,
        notes: formData.notes,
        invoiceDate: new Date().toISOString()
      });

      toast.success("Invoice generated successfully");
      setIsDrawerOpen(false);
      fetchInvoices();
      setFormData({ customerId: "", repairJobId: "", items: [], paidAmount: 0, notes: "" });
      setPaymentType("FULL");
    } catch (error: any) {
      console.error("Invoice creation failure", error);
      toast.error(error.response?.data?.message || "Failed to generate official invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Revenue & Billing" 
        description="Synchronized invoicing engine for hardware sales and maintenance services."
        action={
          <Button variant="primary" onClick={() => setIsDrawerOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5" /> Generate Invoice
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-72">
              <Input
                type="text"
                placeholder="Search registry..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4 font-black uppercase text-[9px] tracking-widest">Invoice Code</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Client Profile</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Issued Date</TableHead>
              <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Payment Status</TableHead>
              <TableHead className="text-right py-4 font-black uppercase text-[9px] tracking-widest">Total Valuation</TableHead>
              <TableHead className="text-right px-6 py-4 font-black uppercase text-[9px] tracking-widest">Actions</TableHead>
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
                  No records found in the financial registry.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-primary/5 transition-colors cursor-default">
                  <TableCell className="px-6 py-4 font-black text-primary text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell className="py-4">
                    <div className="font-bold text-foreground text-sm">{inv.customer?.fullName}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">{inv.customer?.customerCode}</div>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-muted-foreground">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge status={inv.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right py-4 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination page={page} totalPages={Math.ceil(total / limit)} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Generate Official Invoice"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Grand Total</span>
              <span className="text-2xl font-black text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)} className="rounded-xl font-bold">Discard</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20">
                {isSubmitting ? "Generating..." : "Finalize Invoice"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Billing Configuration</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction Engine v1.0</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Select Client
                </label>
                <SearchableSelect
                  options={customers.map(c => ({ value: c.id, label: `${c.fullName} (${c.customerCode})` }))}
                  value={formData.customerId}
                  onChange={(val) => setFormData({ ...formData, customerId: val })}
                  placeholder="Identify customer..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invoice Stream</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
                   <button 
                     onClick={() => { setInvoiceType("REPAIR"); setFormData({ ...formData, items: [], repairJobId: "" }); }}
                     className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black transition-all", invoiceType === "REPAIR" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                   >
                     <Wrench className="h-3 w-3" /> Technical
                   </button>
                   <button 
                     onClick={() => { setInvoiceType("PRODUCT"); setFormData({ ...formData, items: [], repairJobId: "" }); }}
                     className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black transition-all", invoiceType === "PRODUCT" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                   >
                     <Box className="h-3 w-3" /> Product
                   </button>
                   <button 
                     onClick={() => { setInvoiceType("BOTH"); setFormData({ ...formData, items: [], repairJobId: "" }); }}
                     className={cn("flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black transition-all", invoiceType === "BOTH" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                   >
                     <CreditCard className="h-3 w-3" /> Combined
                   </button>
                </div>
              </div>

              {(invoiceType === "REPAIR" || invoiceType === "BOTH") && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Wrench className="h-3 w-3" /> Linked Maintenance Ticket
                  </label>
                  <SearchableSelect
                    options={repairs.map(r => ({ value: r.id, label: `${r.jobNumber} - ${r.brand} ${r.model}` }))}
                    value={formData.repairJobId}
                    onChange={handleSelectRepair}
                    placeholder="Select completed repair..."
                  />
                </div>
              )}

              {(invoiceType === "PRODUCT" || invoiceType === "BOTH") && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Box className="h-3 w-3" /> Asset Catalog
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                    {products.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => handleAddItem(product)}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background hover:border-primary/50 transition-all text-left group"
                      >
                        <div>
                          <p className="text-[11px] font-black text-foreground group-hover:text-primary">{product.name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Stock: {product.stockQuantity} | Brand: {product.brand}</p>
                        </div>
                        <span className="text-xs font-black text-primary">₹{product.sellingPrice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-3xl p-6 border flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Line Items</h4>
                <span className="text-[10px] font-bold text-muted-foreground">{formData.items.length} items</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                {formData.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3 opacity-50">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">Select technical or product items to populate the invoice.</p>
                  </div>
                ) : (
                  formData.items.map((item, idx) => (
                    <div key={idx} className="bg-background border rounded-xl p-3 space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="flex items-start justify-between">
                        <p className="text-[11px] font-black text-foreground leading-tight max-w-[70%]">{item.name}</p>
                        <button onClick={() => handleRemoveItem(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateItemQty(idx, -1)} disabled={item.isRepair} className="text-muted-foreground hover:text-primary disabled:opacity-30">
                            <MinusCircle className="h-4 w-4" />
                          </button>
                          <span className="text-xs font-black tabular-nums">{item.quantity}</span>
                          <button onClick={() => handleUpdateItemQty(idx, 1)} disabled={item.isRepair} className="text-muted-foreground hover:text-primary disabled:opacity-30">
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs font-black text-foreground">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-4 pt-6 border-t border-border/50">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Strategy</label>
                   <div className="grid grid-cols-2 gap-2 p-1 bg-background border rounded-xl">
                      <button 
                        onClick={() => setPaymentType("FULL")}
                        className={cn("py-2 rounded-lg text-[10px] font-bold transition-all", paymentType === "FULL" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                      >
                        Full Payment
                      </button>
                      <button 
                        onClick={() => setPaymentType("PARTIAL")}
                        className={cn("py-2 rounded-lg text-[10px] font-bold transition-all", paymentType === "PARTIAL" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                      >
                        Initial Payment
                      </button>
                   </div>
                </div>

                {paymentType === "PARTIAL" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Deposit Amount</label>
                    <Input 
                      type="number" 
                      placeholder="Amount received..."
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                      className="h-11 text-xs font-bold bg-background"
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
