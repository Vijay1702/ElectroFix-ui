import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoiceService } from "@/services/finance.service";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import { repairService } from "@/services/repair.service";
import { 
  Plus, Search, Eye, Printer,
  Smartphone, Globe, 
  Receipt, X, Zap, Tag
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable,type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { Modal } from "@/components/shared/Modal";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import qrScanner from "@/assets/QR_Scanner.png";
import { useGlobalLoaderStore } from "@/stores/global-loader.store";

export default function InvoicesPage() {
  useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsLoading } = useGlobalLoaderStore();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    repairJobId: "",
    items: [] as any[],
    paidAmount: 0,
    discount: 0,
    notes: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (location.state?.highlightJobId && invoices.length > 0) {
      const jobId = location.state.highlightJobId;
      const targetInvoice = invoices.find(inv => inv.repairJobId === jobId);
      if (targetInvoice) {
        handlePrintInvoice(targetInvoice);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, invoices, navigate]);

  useEffect(() => {
    if (isDrawerOpen) {
      loadInitialData();
      setErrors({});
      setProductSearch("");
    }
  }, [isDrawerOpen]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices(1, 1000, "", "");
      setInvoices(res.data);
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
        repairService.getRepairsLookup("pending_to_deliver")
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
      if (existingItem.quantity >= product.stockQuantity) {
        toast.warning(`Cannot add more than available stock (${product.stockQuantity})`);
        return;
      }
      const newItems = formData.items.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      );
      setFormData({ ...formData, items: newItems });
    } else {
      if (product.stockQuantity <= 0) {
        toast.warning("This product is out of stock");
        return;
      }
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

    // Verify stock limit
    const product = products.find(p => p.id === item.productId);
    if (product && newQty > product.stockQuantity) {
      toast.warning(`Cannot add more than available stock (${product.stockQuantity})`);
      return;
    }

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
      const estCost = Number(repair.estimatedCost || 0);
      const productCost = repair.invoices?.reduce((sum: number, inv: any) => sum + (inv.items?.filter((i: any) => i.itemType !== 'REPAIR' && i.itemType !== 'SERVICE').reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0) || 0), 0) || 0;
      const totalPaid = repair.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0;
      const remainingBalance = Math.max(0, (estCost + productCost) - totalPaid);

      const brandModelStr = [repair.brand, repair.model].filter((val) => val && val !== 'null').join(' ');
      const deviceDetails = [repair.deviceType, brandModelStr ? `(${brandModelStr})` : ''].filter(Boolean).join(' ');
      const repairItem = {
        name: `Repair Job #${repair.jobNumber}: ${deviceDetails}` + (repair.problemDescription ? ` - ${repair.problemDescription}` : ''),
        quantity: 1,
        unitPrice: remainingBalance,
        totalPrice: remainingBalance,
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
  const discount = Number(formData.discount || 0);
  const grandTotal = Math.max(0, subtotal + tax - discount);

  useEffect(() => {
    if (paymentType === "FULL") {
      setFormData(prev => ({ ...prev, paidAmount: grandTotal }));
    }
  }, [paymentType, grandTotal]);

  const handleFinalize = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) {
      newErrors.customerId = "Customer is required";
      toast.error("Please select a billing customer");
    }
    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
      toast.error("Please add at least one item to the invoice");
    }

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

      const newInvoice = await invoiceService.createInvoice({
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
      
      // Automatically trigger receipt print dialog
      if (newInvoice && newInvoice.id) {
        handlePrintInvoice(newInvoice);
      }

      setFormData({ customerId: "", repairJobId: "", items: [], paidAmount: 0, discount: 0, notes: "" });
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

  const handlePrintInvoice = async (inv: any) => {
    setIsDownloading(inv.id);
    setIsLoading(true);
    try {
      const response = await invoiceService.generatePDFDirect(inv);
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      
      if (blob.size < 1000) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          toast.error(`Server Error: ${json.message || "Failed to prepare print document"}`);
          return;
        } catch (e) {
          // Not JSON, continue with printing
        }
      }

      const url = window.URL.createObjectURL(blob);
      
      // Create hidden iframe to trigger print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          window.URL.revokeObjectURL(url);
        }, 3000);
      };
      
      toast.success("Preparing print layout...");
    } catch (error) {
      toast.error("Failed to prepare PDF. System might be busy.");
    } finally {
      setIsDownloading(null);
      setIsLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Invoice No.",
      accessor: "invoiceNumber",
      render: (inv) => (
        <span className="font-semibold text-primary text-sm">{inv.invoiceNumber}</span>
      )
    },
    {
      header: "Customer Name",
      accessor: "customer",
      render: (inv) => (
        <span className="font-semibold text-foreground text-sm">{inv.customer?.fullName}</span>
      )
    },
    {
      header: "Customer Code",
      render: (inv) => (
        <span className="text-sm text-muted-foreground">{inv.customer?.customerCode}</span>
      )
    },
    {
      header: "Date Issued",
      accessor: "invoiceDate",
      render: (inv) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "paymentStatus",
      render: (inv) => <StatusBadge status={inv.paymentStatus} />,
    },
    {
      header: "Amount Paid",
      accessor: "paidAmount",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (inv) => (
        <span className="font-semibold text-sm text-foreground tabular-nums">
          ₹{Number(inv.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (inv) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleViewInvoice(inv.id)}
            className="h-8 w-8 flex items-center justify-center bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePrintInvoice(inv)}
            disabled={isDownloading === inv.id}
            className="h-8 w-8 flex items-center justify-center bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
          >
            {isDownloading === inv.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-700">

      <DataTable
        data={invoices}
        columns={columns}
        loading={loading}
        loadingMessage="Loading invoices..."
        emptyMessage="No invoices found."
        emptyIcon={<Receipt className="h-12 w-12" />}
        title="Revenue Registry"
        searchable
        searchPlaceholder="Search invoices..."
        paginated
        onAddClick={() => setIsDrawerOpen(true)}
        addLabel="Generate Invoice"
      />

      {/* Invoice Creation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Generate Official Invoice"
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {paymentType === "PARTIAL" ? "Advance Collected" : "Grand Total"}
              </span>
              <span className="text-2xl font-black text-primary tabular-nums">
                ₹{(paymentType === "PARTIAL" ? Number(formData.paidAmount || 0) : grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1 sm:flex-initial" onClick={handleFinalize} disabled={isSubmitting}>
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
                    if (type.id === "PRODUCT" && paymentType === "PARTIAL") setPaymentType("FULL");
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
                  const currentRepair = repairs.find(r => r.id === formData.repairJobId);
                  const newItems = currentRepair && currentRepair.customerId !== val
                    ? formData.items.filter(item => !item.isRepair)
                    : formData.items;
                  setFormData({ 
                    ...formData, 
                    customerId: val,
                    repairJobId: currentRepair && currentRepair.customerId === val ? formData.repairJobId : "",
                    items: newItems
                  });
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
                  options={repairs
                    .filter(r => !formData.customerId || r.customerId === formData.customerId)
                    .map(r => {
                      const brandModelStr = [r.brand, r.model].filter((val) => val && val !== 'null').join(' ');
                      const deviceDetails = [r.deviceType, brandModelStr ? `(${brandModelStr})` : ''].filter(Boolean).join(' ');
                      const labelParts = [r.jobNumber, deviceDetails, r.problemDescription].filter(Boolean);
                      return {
                        value: r.id,
                        label: labelParts.join(' - ')
                      };
                    })}
                  value={formData.repairJobId}
                  onChange={handleSelectRepair}
                  required
                />
                
                {formData.repairJobId && (() => {
                  const r = repairs.find(x => x.id === formData.repairJobId);
                  if (!r) return null;
                  const estCost = Number(r.estimatedCost || 0);
                  const productCost = r.invoices?.reduce((sum: number, inv: any) => sum + (inv.items?.filter((i: any) => i.itemType !== 'REPAIR' && i.itemType !== 'SERVICE').reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0) || 0), 0) || 0;
                  const totalPaid = r.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0;
                  const balance = Math.max(0, (estCost + productCost) - totalPaid);
                  return (
                    <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Balance Calculation</p>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Job Cost</p>
                          <p className="text-sm font-black text-foreground tabular-nums">₹{(estCost + productCost).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">Paid So Far</p>
                          <p className="text-sm font-black text-emerald-600 tabular-nums">₹{totalPaid.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-primary/70 uppercase mb-1">Due Balance</p>
                          <p className="text-sm font-black text-primary tabular-nums">₹{balance.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <div className="mt-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {(() => {
                    const filteredProducts = products.filter(p => {
                      if (p.stockQuantity <= 0) return false;
                      if (!productSearch) return true;
                      const s = productSearch.toLowerCase();
                      return (
                        (p.name && p.name.toLowerCase().includes(s)) ||
                        (p.brand && p.brand.toLowerCase().includes(s)) ||
                        (p.productCode && p.productCode.toLowerCase().includes(s))
                      );
                    });

                    if (filteredProducts.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs font-bold text-muted-foreground italic bg-muted/5 rounded-2xl border border-dashed border-border/50">
                          No matching inventory items in stock.
                        </div>
                      );
                    }

                    return filteredProducts.map(product => (
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
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-6 pt-6 border-t border-dashed">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Billing Line Items</label>
              <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-4">
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

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border/50 flex justify-between items-center text-sm font-black text-foreground">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Terms */}
          <div className="space-y-8 pt-8 border-t-2 border-dashed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payment Terms</label>
                <div className="flex p-1 bg-muted/30 rounded-xl gap-1">
                  {(invoiceType === "PRODUCT" ? ["FULL"] : ["FULL", "PARTIAL"]).map((term) => (
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

            {/* Optional Flat Discount Input */}
            <div className="space-y-4">
              <Input
                label="Discount (₹)"
                type="number"
                placeholder="Enter flat discount amount..."
                value={formData.discount || ""}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setFormData({ ...formData, discount: val });
                }}
                icon={<Tag className="h-4 w-4" />}
              />
            </div>

            {paymentType === "PARTIAL" && (
              <div className="animate-in slide-in-from-top-2 duration-300 space-y-2">
                <Input
                  label="Advance Collected"
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                  icon={<Receipt className="h-4 w-4" />}
                />
                {invoiceType === "BOTH" && (
                  <div className="text-[10px] text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
                    {(() => {
                      const productSubtotal = formData.items.filter(i => !i.isRepair).reduce((sum, i) => sum + Number(i.totalPrice), 0);
                      const repairSubtotal = formData.items.filter(i => i.isRepair).reduce((sum, i) => sum + Number(i.totalPrice), 0);
                      const paid = Number(formData.paidAmount || 0);
                      const paidProduct = Math.min(paid, productSubtotal);
                      const paidRepair = Math.max(0, paid - productSubtotal);
                      const productBalance = productSubtotal - paidProduct;
                      const repairBalance = repairSubtotal - paidRepair;
                      
                      return (
                        <div className="space-y-1.5">
                          <p className="font-bold text-foreground">Payment Distribution:</p>
                          <ul className="space-y-0.5 list-disc list-inside">
                            <li><span className="font-bold text-foreground">₹{paidProduct.toLocaleString()}</span> applied to products.</li>
                            <li><span className="font-bold text-foreground">₹{paidRepair.toLocaleString()}</span> applied to repair.</li>
                          </ul>
                          {(productBalance > 0 || repairBalance > 0) && (
                            <div className="pt-1 mt-1 border-t border-border/30 text-amber-600 dark:text-amber-500 font-medium">
                              Unpaid balance (₹{productBalance.toLocaleString()} product + ₹{repairBalance.toLocaleString()} repair) will be carried over to the linked repair job.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
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
        title="Invoice Details"
        size="lg"
      >
        <div className="flex flex-col h-full bg-muted/20 font-sans selection:bg-primary/20 selection:text-primary overflow-hidden">
           {selectedInvoiceForView ? (
             <div className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                
                {/* A4-like Paper Container */}
                <div className="w-full max-w-4xl bg-white shadow-xl ring-1 ring-border/5 rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                   
                   {/* Header Section */}
                   <div className="px-8 py-10 sm:px-12 sm:py-12 border-b border-border/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                         {/* Company Info */}
                         <div className="space-y-1">
                            <h2 className="text-2xl font-black text-foreground tracking-tight">Sri Senthil Spares & Services</h2>
                            <p className="text-sm text-muted-foreground">Thalayari street, Pattukkottai</p>
                            <p className="text-sm text-muted-foreground">Thanjavur district, Tamil Nadu - 614601</p>
                         </div>
                         
                         {/* Invoice Meta */}
                         <div className="text-left sm:text-right space-y-2">
                            <div className="inline-flex items-center gap-2 mb-2">
                               <StatusBadge status={selectedInvoiceForView.paymentStatus} />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-primary uppercase tracking-tighter">
                               INVOICE
                            </h1>
                            <p className="text-base font-bold text-foreground">
                               {selectedInvoiceForView.invoiceNumber}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                               Date: {new Date(selectedInvoiceForView.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* Customer Section */}
                   <div className="px-8 py-8 sm:px-12 border-b border-border/50">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Bill To</h4>
                      <div className="space-y-1">
                         <p className="text-lg font-bold text-foreground">
                            {selectedInvoiceForView.customer?.fullName}
                         </p>
                         <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Smartphone className="h-3.5 w-3.5" />
                            {selectedInvoiceForView.customer?.phoneNumber}
                         </p>
                         {selectedInvoiceForView.customer?.email && (
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                               <Globe className="h-3.5 w-3.5" />
                               {selectedInvoiceForView.customer?.email}
                            </p>
                         )}
                      </div>
                   </div>

                   {/* Line Items Table */}
                   <div className="px-8 py-8 sm:px-12 flex-1">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b-2 border-border/60">
                               <th className="py-3 text-[11px] font-black text-muted-foreground uppercase tracking-wider">Item Description</th>
                               <th className="py-3 text-center text-[11px] font-black text-muted-foreground uppercase tracking-wider w-20">Qty</th>
                               <th className="py-3 text-right text-[11px] font-black text-muted-foreground uppercase tracking-wider w-32">Rate</th>
                               <th className="py-3 text-right text-[11px] font-black text-muted-foreground uppercase tracking-wider w-32">Total</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-border/30">
                            {selectedInvoiceForView.items?.map((item: any, idx: number) => (
                               <tr key={idx} className="group hover:bg-muted/5 transition-colors">
                                  <td className="py-4 pr-4">
                                     <p className="text-sm font-bold text-foreground">{item.itemName}</p>
                                     <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">{item.itemType}</p>
                                  </td>
                                  <td className="py-4 text-sm font-medium text-muted-foreground text-center tabular-nums">{item.quantity}</td>
                                  <td className="py-4 text-sm font-medium text-muted-foreground text-right tabular-nums">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-4 text-sm font-bold text-foreground text-right tabular-nums">₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   {/* Totals Section */}
                   <div className="px-8 pb-10 sm:px-12 pt-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-8">
                         {/* Payment Notes / Info */}
                         <div className="flex-1 space-y-4 pt-4 border-t sm:border-t-0 sm:pt-0 border-border/50 sm:pr-8">
                            <div>
                               <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Payment Details</h4>
                               <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
                                  {selectedInvoiceForView.notes?.split('Method: ')[1]?.split('.')[0] || 'CASH'}
                               </p>
                            </div>
                            {selectedInvoiceForView.notes && (
                               <div>
                                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Notes</h4>
                                  <p className="text-xs font-medium text-muted-foreground max-w-xs">{selectedInvoiceForView.notes}</p>
                               </div>
                            )}
                         </div>

                         {/* Amounts */}
                         <div className="w-full sm:w-72 space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                               <span>Subtotal</span>
                               <span className="tabular-nums">₹{Number(selectedInvoiceForView.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                               <span>Tax</span>
                               <span className="tabular-nums">₹{Number(selectedInvoiceForView.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {selectedInvoiceForView.discount > 0 && (
                               <div className="flex justify-between items-center text-sm font-medium text-rose-500">
                                  <span>Discount</span>
                                  <span className="tabular-nums">-₹{Number(selectedInvoiceForView.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                               </div>
                            )}
                            
                            <div className="pt-3 border-t-2 border-border/50">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-base font-black text-foreground uppercase tracking-wide">Total Amount</span>
                                  <span className="text-xl font-black text-foreground tabular-nums">
                                     ₹{Number(selectedInvoiceForView.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                               </div>
                               <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                                  <span>Amount Paid</span>
                                  <span className="tabular-nums">₹{Number(selectedInvoiceForView.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                               </div>
                               
                               {Number(selectedInvoiceForView.grandTotal) - Number(selectedInvoiceForView.paidAmount) > 0 && (
                                  <div className="flex justify-between items-center text-sm font-bold text-amber-600 mt-1">
                                     <span>Balance Due</span>
                                     <span className="tabular-nums">₹{(Number(selectedInvoiceForView.grandTotal) - Number(selectedInvoiceForView.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center bg-muted/20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
             </div>
           )}

           {/* Sticky Action Bar */}
           {selectedInvoiceForView && (
             <div className="px-6 py-4 bg-white border-t border-border/50 flex justify-end gap-4 shadow-xl z-10 shrink-0">
                <Button 
                   variant="outline" 
                   onClick={() => setIsViewModalOpen(false)}
                   className="w-full sm:w-auto px-8"
                >
                   Close
                </Button>
                <Button 
                   variant="primary" 
                   onClick={() => handlePrintInvoice(selectedInvoiceForView)}
                   disabled={isDownloading === selectedInvoiceForView.id}
                   className="w-full sm:w-auto px-8 flex items-center justify-center gap-2"
                >
                   {isDownloading === selectedInvoiceForView.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                   ) : (
                      <>
                        <Printer className="h-4 w-4" /> Print
                      </>
                   )}
                </Button>
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
