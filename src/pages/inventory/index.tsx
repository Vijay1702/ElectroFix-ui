import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import { 
  AlertTriangle, 
  Edit3, 
  Package, 
  DollarSign, 
  Box, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  MapPin, 
  History,
  Layers,
  Search
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { useAuth } from "@/contexts/AuthContext";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  return `${apiUrl.replace('/api/v1', '')}${url}`;
};
export default function InventoryPage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";

  // Tab State
  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');

  // Stock Levels States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "HEALTHY">("ALL");

  // Stock Movements States
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Drawers States
  const [isLocationDrawerOpen, setIsLocationDrawerOpen] = useState(false);
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Location Form State
  const [locationForm, setLocationForm] = useState({
    shelf: "",
    row: "",
    minimumStock: ""
  });
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({});
  const [locationSubmitting, setLocationSubmitting] = useState(false);

  // Adjust Stock Form State
  const [adjustForm, setAdjustForm] = useState({
    movementType: "in", // "in" | "out" | "adjustment"
    quantity: "",
    referenceType: ""
  });
  const [adjustErrors, setAdjustErrors] = useState<Record<string, string>>({});
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (activeTab === 'levels') {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [categoryFilter, stockStatusFilter, activeTab]);

  useEffect(() => {
    // Fetch categories once
    productService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch all products
      const res = await productService.getProducts(1, 1000, "", categoryFilter);
      let data = res.data || [];

      // Apply client-side stock status filter
      if (stockStatusFilter === "LOW_STOCK") {
        data = data.filter((p: any) => p.stockQuantity <= p.minimumStock && p.stockQuantity > 0);
      } else if (stockStatusFilter === "OUT_OF_STOCK") {
        data = data.filter((p: any) => p.stockQuantity === 0);
      } else if (stockStatusFilter === "HEALTHY") {
        data = data.filter((p: any) => p.stockQuantity > p.minimumStock);
      }

      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setMovementsLoading(true);
    try {
      const res = await stockService.getStockMovements(1, 1000);
      setMovements(res.movements || []);
    } catch (error) {
      console.error("Failed to fetch stock movements", error);
    } finally {
      setMovementsLoading(false);
    }
  };

  // Metrics (Always calculated from a full lookup to reflect true dashboard status)
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    stockValue: 0
  });

  useEffect(() => {
    productService.getProductsLookup()
      .then(res => {
        const list = res.data || [];
        const low = list.filter((p: any) => p.stockQuantity <= p.minimumStock && p.stockQuantity > 0).length;
        const out = list.filter((p: any) => p.stockQuantity === 0).length;
        const val = list.reduce((acc: number, p: any) => acc + (Number(p.purchasePrice) * p.stockQuantity), 0);
        setMetrics({
          totalItems: res.total || list.length,
          lowStock: low,
          outOfStock: out,
          stockValue: val
        });
      })
      .catch(err => console.error("Failed to calculate metrics", err));
  }, [products]); // Recalculate whenever products update


  const handleOpenLocationDrawer = (product: any) => {
    setSelectedProduct(product);
    setLocationForm({
      shelf: product.shelf || "",
      row: product.row || "",
      minimumStock: product.minimumStock !== undefined ? product.minimumStock.toString() : "5"
    });
    setLocationErrors({});
    setIsLocationDrawerOpen(true);
  };

  const handleOpenAdjustDrawer = (product: any) => {
    setSelectedProduct(product);
    setAdjustForm({
      movementType: "in",
      quantity: "",
      referenceType: "Restock"
    });
    setAdjustErrors({});
    setIsAdjustDrawerOpen(true);
  };


  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const minAlert = Number(locationForm.minimumStock);

    if (locationForm.minimumStock === "" || isNaN(minAlert) || minAlert < 0 || !Number.isInteger(minAlert)) {
      errors.minimumStock = "Please enter a valid positive minimum alert level";
    }

    if (Object.keys(errors).length > 0) {
      setLocationErrors(errors);
      return;
    }

    setLocationSubmitting(true);
    try {
      await productService.updateProduct(selectedProduct.id, {
        shelf: locationForm.shelf.trim() || null,
        row: locationForm.row.trim() || null,
        minimumStock: minAlert
      });
      setIsLocationDrawerOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Location update failed", error);
      alert("Failed to update storage locations.");
    } finally {
      setLocationSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const qty = Number(adjustForm.quantity);

    if (adjustForm.quantity === "" || isNaN(qty) || !Number.isInteger(qty)) {
      errors.quantity = "Please enter a valid integer quantity";
    } else {
      if (adjustForm.movementType === "adjustment") {
        if (qty === 0) {
          errors.quantity = "Adjustment quantity cannot be zero";
        }
      } else {
        if (qty <= 0) {
          errors.quantity = "Quantity must be greater than zero";
        }
      }

      // Check for insufficient stock on stock out
      if (adjustForm.movementType === "out" && qty > 0 && selectedProduct.stockQuantity < qty) {
        errors.quantity = `Insufficient stock. Current stock is only ${selectedProduct.stockQuantity}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setAdjustErrors(errors);
      return;
    }

    setAdjustSubmitting(true);
    try {
      await stockService.createStockMovement({
        productId: selectedProduct.id,
        movementType: adjustForm.movementType,
        quantity: qty,
        referenceType: adjustForm.referenceType.trim() || undefined
      });
      setIsAdjustDrawerOpen(false);
      // Refresh products and metrics
      fetchProducts();
      // If we are on the movements tab, refresh movements too
      if (activeTab === 'movements') {
        fetchMovements();
      }
    } catch (error: any) {
      console.error("Stock adjustment failed", error);
      const errMsg = error.response?.data?.message || "Failed to record stock movement.";
      alert(errMsg);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const levelsColumns: Column<any>[] = [
    {
      header: "Product Name",
      accessor: "name",
      render: (product) => {
        const imageUrl = getImageUrl(product.imageUrl);
        return (
          <div className="flex items-center gap-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-8 w-8 rounded-lg object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Package className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-foreground">{product.name}</div>
              {product.brand && (
                <div className="text-[10px] text-muted-foreground font-semibold">
                  Brand: {product.brand}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Category",
      accessor: "categoryId",
     
      render: (product) => (
        <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px] font-black uppercase tracking-[0.1em]">
          {product.category?.name || 'Beverage'}
        </span>
      )
    },
    {
      header: "Current Stock",
      accessor: "stockQuantity",
    
      render: (product) => (
        <span className="text-sm font-black text-foreground">
          {product.stockQuantity} {product.unit || 'pcs'}
        </span>
      )
    },
    {
      header: "Reorder Level",
      accessor: "minimumStock",
    
      render: (product) => (
        <span className="text-sm font-bold text-muted-foreground">
          {product.minimumStock} {product.unit || 'pcs'}
        </span>
      )
    }
  ];

  if (isAdmin) {
    levelsColumns.push({
      header: "Stock Value",
      render: (product) => {
        const value = Number(product.purchasePrice || 0) * product.stockQuantity;
        return (
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    });
  }

  levelsColumns.push({
    header: "Status",
    render: (product) => {
      const isExpired = product.status === "Expired" || product.name?.toLowerCase().includes("expired");
      const isOut = product.stockQuantity === 0;
      const isLow = product.stockQuantity <= product.minimumStock;
      
      let statusText = "In Stock";
      let badgeColor = "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
      
      if (isExpired) {
        statusText = "Expired";
        badgeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold";
      } else if (isOut) {
        statusText = "Out of Stock";
        badgeColor = "bg-red-500/10 text-red-500 border border-red-500/20 font-bold";
      } else if (isLow) {
        statusText = "Low Stock";
        badgeColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold";
      }
      
      return (
        <span className={`text-[10px] px-2.5 py-1 rounded uppercase font-black tracking-wider ${badgeColor}`}>
          {statusText}
        </span>
      );
    }
  });

  if (isAdmin || userRole === "STAFF") {
    levelsColumns.push({
      header: "Inventory Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-lg"
            onClick={() => handleOpenAdjustDrawer(product)}
            title="Adjust Stock"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-lg"
            onClick={() => handleOpenLocationDrawer(product)}
            title="Update Location & Alert Level"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      )
    });
  }

  const movementsColumns: Column<any>[] = [
    {
      header: "Date & Time",
      accessor: "createdAt",
      render: (movement) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(movement.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </span>
      )
    },
    {
      header: "Product / Code",
      accessor: "product.name",
      render: (movement) => (
        <div>
          <div className="font-bold text-xs text-foreground">{movement.product?.name || "Deleted Product"}</div>
          <div className="text-[9px] text-muted-foreground font-semibold uppercase">
            {movement.product?.productCode || "-"}
          </div>
        </div>
      )
    },
    {
      header: "Movement Type",
      accessor: "movementType",
      render: (movement) => {
        const type = movement.movementType;
        let badgeStyle = "bg-blue-500/10 text-blue-500";
        let Icon = RefreshCw;
        let label = "Adjustment";

        if (type === "IN" || type === "in") {
          badgeStyle = "bg-green-500/10 text-green-500";
          Icon = TrendingUp;
          label = "Stock In";
        } else if (type === "OUT" || type === "out") {
          badgeStyle = "bg-red-500/10 text-red-500";
          Icon = TrendingDown;
          label = "Stock Out";
        }

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}>
            <Icon className="h-3 w-3" /> {label}
          </span>
        );
      }
    },
    {
      header: "Qty Change",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (movement) => {
        const type = movement.movementType;
        const prefix = (type === "IN" || type === "in") ? "+" : (type === "OUT" || type === "out") ? "-" : "";
        const color = (type === "IN" || type === "in") ? "text-green-600 dark:text-green-400" : (type === "OUT" || type === "out") ? "text-red-500" : "text-blue-500";
        return (
          <span className={`font-black text-sm ${color}`}>
            {prefix}{movement.quantity}
          </span>
        );
      }
    },
    {
      header: "Stock Ledger",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (movement) => (
        <span className="text-xs font-bold text-muted-foreground">
          {movement.previousStock} &rarr; {movement.currentStock}
        </span>
      )
    },
    {
      header: "Ref / Reason",
      accessor: "referenceType",
      render: (movement) => (
        <div className="text-xs">
          <span className="font-semibold text-foreground uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-muted">
            {movement.referenceType || "MANUAL"}
          </span>
          {movement.referenceId && (
            <span className="text-muted-foreground block text-[10px] mt-0.5 truncate max-w-[150px]">
              {movement.referenceId}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Performed By",
      accessor: "user.fullName",
      render: (movement) => (
        <span className="text-xs font-bold text-primary">
          {movement.user?.fullName || "System"}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        {/* Card 1: Total Parts */}
        <div
          onClick={() => setStockStatusFilter("ALL")}
          className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 group hover:-translate-y-1
            ${stockStatusFilter === "ALL" 
              ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_8px_30px_rgb(59,130,246,0.15)]' 
              : 'border-border/50 bg-background/50 hover:border-blue-500/30 hover:bg-blue-500/5 hover:shadow-lg'
            } backdrop-blur-xl`}
        >
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Total Parts</h3>
              <p className="text-4xl font-black mt-2 tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">{metrics.totalItems}</p>
            </div>
            <div className={`p-3 rounded-2xl transition-all duration-300 ${stockStatusFilter === "ALL" ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110'}`}>
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 font-semibold flex items-center gap-1.5 opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgb(59,130,246)]"></span>
            All registered unique products
          </p>
        </div>

        {/* Card 2: Low Stock */}
        <div
          onClick={() => setStockStatusFilter("LOW_STOCK")}
          className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 group hover:-translate-y-1
            ${stockStatusFilter === "LOW_STOCK" 
              ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_8px_30px_rgb(245,158,11,0.15)]' 
              : 'border-border/50 bg-background/50 hover:border-amber-500/30 hover:bg-amber-500/5 hover:shadow-lg'
            } backdrop-blur-xl`}
        >
          <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                Low Stock <AlertTriangle className="h-3 w-3" />
              </h3>
              <p className="text-4xl font-black mt-2 tracking-tight text-amber-600 dark:text-amber-500 drop-shadow-sm">{metrics.lowStock}</p>
            </div>
            <div className={`p-3 rounded-2xl transition-all duration-300 ${stockStatusFilter === "LOW_STOCK" ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 font-semibold flex items-center gap-1.5 opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgb(245,158,11)] animate-pulse"></span>
            Items near or below alert levels
          </p>
        </div>

        {/* Card 3: Out of Stock */}
        <div
          onClick={() => setStockStatusFilter("OUT_OF_STOCK")}
          className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 group hover:-translate-y-1
            ${stockStatusFilter === "OUT_OF_STOCK" 
              ? 'border-red-500/50 bg-red-500/10 shadow-[0_8px_30px_rgb(239,68,68,0.15)]' 
              : 'border-border/50 bg-background/50 hover:border-red-500/30 hover:bg-red-500/5 hover:shadow-lg'
            } backdrop-blur-xl`}
        >
          <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em]">Out of Stock</h3>
              <p className="text-4xl font-black mt-2 tracking-tight text-red-500 drop-shadow-sm">{metrics.outOfStock}</p>
            </div>
            <div className={`p-3 rounded-2xl transition-all duration-300 ${stockStatusFilter === "OUT_OF_STOCK" ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110' : 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:scale-110'}`}>
              <Box className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 font-semibold flex items-center gap-1.5 opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgb(239,68,68)]"></span>
            Items currently with zero stock
          </p>
        </div>

        {/* Card 4: Value / Healthy */}
        {isAdmin ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-5 hover:border-green-500/40 hover:bg-green-500/5 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-[0.15em]">Stock Assets Value</h3>
                <p className="text-3xl sm:text-4xl font-black mt-2 tracking-tight text-green-600 dark:text-green-400 drop-shadow-sm">
                  ₹{metrics.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-500 group-hover:bg-green-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 font-semibold flex items-center gap-1.5 opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgb(34,197,94)]"></span>
              Estimated cost value of stored stock
            </p>
          </div>
        ) : (
          <div
            onClick={() => setStockStatusFilter("HEALTHY")}
            className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 group hover:-translate-y-1
              ${stockStatusFilter === "HEALTHY" 
                ? 'border-green-500/50 bg-green-500/10 shadow-[0_8px_30px_rgb(34,197,94,0.15)]' 
                : 'border-border/50 bg-background/50 hover:border-green-500/30 hover:bg-green-500/5 hover:shadow-lg'
              } backdrop-blur-xl`}
          >
            <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700 blur-2xl"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-[0.15em]">Healthy Stock</h3>
                <p className="text-4xl font-black mt-2 tracking-tight text-green-600 dark:text-green-400 drop-shadow-sm">
                  {metrics.totalItems - metrics.lowStock - metrics.outOfStock}
                </p>
              </div>
              <div className={`p-3 rounded-2xl transition-all duration-300 ${stockStatusFilter === "HEALTHY" ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110' : 'bg-green-500/10 text-green-600 dark:text-green-500 group-hover:bg-green-500 group-hover:text-white group-hover:scale-110'}`}>
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 font-semibold flex items-center gap-1.5 opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgb(34,197,94)]"></span>
              Stored parts with healthy levels
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-2">
        <button
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'levels' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('levels')}
        >
          <Boxes className="h-4 w-4" /> Stock Levels
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'movements' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('movements')}
        >
          <History className="h-4 w-4" /> Stock Movements Ledger
        </button>
      </div>

      {/* Content Rendering based on Tab */}
      {activeTab === 'levels' ? (
        <DataTable
          data={products}
          columns={levelsColumns}
          loading={loading}
          loadingMessage="Loading inventory stock levels..."
          emptyIcon={<Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />}
          emptyMessage="No spare parts found matching current filters."
          title="Inventory & Stock Control"
          searchable
          searchPlaceholder="Search name, code, brand..."
          paginated
          toolbarExtra={
            <>
              <select
                className="h-9 px-3 rounded-xl border border-border/60 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="h-9 px-3 rounded-xl border border-border/60 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="HEALTHY">In Stock (Healthy)</option>
                <option value="LOW_STOCK">Low Stock Alerts</option>
                <option value="OUT_OF_STOCK">Out of Stock Only</option>
              </select>
            </>
          }
        />
      ) : (
        <DataTable
          data={movements}
          columns={movementsColumns}
          loading={movementsLoading}
          loadingMessage="Loading transaction logs..."
          emptyIcon={<History className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />}
          emptyMessage="No stock movements registered in store."
          title="Stock Movements Ledger"
          searchable
          searchPlaceholder="Search product or movement type..."
          paginated
        />
      )}

      {/* Location / Placement Drawer */}
      <Drawer
        isOpen={isLocationDrawerOpen}
        onClose={() => setIsLocationDrawerOpen(false)}
        title="Update Placement & Alerts"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLocationDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleLocationSubmit} disabled={locationSubmitting}>
              {locationSubmitting ? "Saving..." : "Save Locations"}
            </Button>
          </>
        }
      >
        <div className="space-y-8 pb-6">
          {selectedProduct && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest">Part Reference</span>
              <h4 className="font-bold text-base text-foreground mt-1">{selectedProduct.name}</h4>
              <p className="text-xs text-muted-foreground font-semibold uppercase">{selectedProduct.productCode}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Store Shelf placement" 
                placeholder="e.g. Shelf A" 
                value={locationForm.shelf}
                onChange={(e) => setLocationForm({...locationForm, shelf: e.target.value})}
                icon={<MapPin className="h-4 w-4" />} 
              />
              <Input 
                label="Store Row placement" 
                placeholder="e.g. Row 3" 
                value={locationForm.row}
                onChange={(e) => setLocationForm({...locationForm, row: e.target.value})}
                icon={<MapPin className="h-4 w-4" />} 
              />
            </div>

            <Input 
              label="Minimum Stock Alert Limit" 
              required 
              type="number" 
              placeholder="e.g. 5" 
              value={locationForm.minimumStock}
              onChange={(e) => {
                setLocationForm({...locationForm, minimumStock: e.target.value});
                if (locationErrors.minimumStock) setLocationErrors({...locationErrors, minimumStock: ""});
              }}
              error={locationErrors.minimumStock}
              icon={<AlertTriangle className="h-4 w-4" />} 
            />
          </div>
        </div>
      </Drawer>

      {/* Adjust Stock Drawer */}
      <Drawer
        isOpen={isAdjustDrawerOpen}
        onClose={() => setIsAdjustDrawerOpen(false)}
        title="Adjust Inventory Stock"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAdjustDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdjustSubmit} disabled={adjustSubmitting}>
              {adjustSubmitting ? "Recording..." : "Save Adjustment"}
            </Button>
          </>
        }
      >
        <div className="space-y-8 pb-6">
          {selectedProduct && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest">Part Reference</span>
              <h4 className="font-bold text-base text-foreground mt-1">{selectedProduct.name}</h4>
              <p className="text-xs text-muted-foreground font-semibold uppercase">{selectedProduct.productCode}</p>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Current Stock:</span>
                <span className="text-foreground font-bold">{selectedProduct.stockQuantity} {selectedProduct.unit || 'pcs'}</span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Adjustment Type
              </label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={adjustForm.movementType}
                onChange={(e) => {
                  const val = e.target.value;
                  let defRef = "Restock";
                  if (val === "out") defRef = "Damaged / Defective";
                  if (val === "adjustment") defRef = "Manual Audit";
                  setAdjustForm({
                    ...adjustForm, 
                    movementType: val,
                    referenceType: defRef
                  });
                }}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="in">Stock In (Add Stock)</option>
                <option value="out">Stock Out (Reduce Stock)</option>
                <option value="adjustment">Manual Adjustment (Override)</option>
              </select>
            </div>

            <Input 
              label={adjustForm.movementType === "adjustment" ? "Quantity Change (Positive or Negative)" : "Quantity"} 
              required 
              type="number" 
              placeholder={adjustForm.movementType === "adjustment" ? "e.g. 5 or -3" : "e.g. 10"} 
              value={adjustForm.quantity}
              onChange={(e) => {
                setAdjustForm({...adjustForm, quantity: e.target.value});
                if (adjustErrors.quantity) setAdjustErrors({...adjustErrors, quantity: ""});
              }}
              error={adjustErrors.quantity}
              icon={<Boxes className="h-4 w-4" />} 
            />

            <Input 
              label="Reference / Reason" 
              placeholder="e.g. Supplier delivery, Damaged part, Audit check" 
              value={adjustForm.referenceType}
              onChange={(e) => setAdjustForm({...adjustForm, referenceType: e.target.value})}
              icon={<Search className="h-4 w-4" />} 
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
