import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { Plus, Search, AlertTriangle, Edit3, Trash2, Package, Tag, DollarSign, Box } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { Pagination } from "@/components/shared/Pagination";
import { DataTable,type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useAuth } from "@/contexts/AuthContext";

export default function ProductsPage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
    minimumStock: "",
    description: "",
    shelf: "",
    row: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    
    // Fetch categories
    productService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(err => console.error("Failed to fetch categories", err));
  }, [page, search, limit, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(page, limit, search, categoryFilter);
      setProducts(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (product: any = null, readOnly = false) => {
    setErrors({});
    setIsReadOnly(readOnly);
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        categoryId: product.categoryId || "",
        purchasePrice: product.purchasePrice || "",
        sellingPrice: product.sellingPrice || "",
        stockQuantity: product.stockQuantity || "",
        minimumStock: product.minimumStock || "",
        description: product.description || "",
        shelf: product.shelf || "",
        row: product.row || ""
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        brand: "",
        categoryId: "",
        purchasePrice: "",
        sellingPrice: "",
        stockQuantity: "",
        minimumStock: "",
        description: "",
        shelf: "",
        row: ""
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Product Name is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    
    const purchase = Number(formData.purchasePrice);
    if (formData.purchasePrice === "" || isNaN(purchase) || purchase < 0) newErrors.purchasePrice = "Valid purchase price is required";
    
    const selling = Number(formData.sellingPrice);
    if (formData.sellingPrice === "" || isNaN(selling) || selling < 0) newErrors.sellingPrice = "Valid selling price is required";
    
    const stock = Number(formData.stockQuantity);
    if (formData.stockQuantity === "" || !Number.isInteger(stock) || stock < 0) newErrors.stockQuantity = "Valid stock quantity is required";
    
    const minStock = Number(formData.minimumStock);
    if (formData.minimumStock === "" || !Number.isInteger(minStock) || minStock < 0) newErrors.minimumStock = "Valid minimum stock is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    try {
      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id, {
          ...formData,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          stockQuantity: Number(formData.stockQuantity),
          minimumStock: Number(formData.minimumStock)
        });
      } else {
        await productService.createProduct({
          ...formData,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          stockQuantity: Number(formData.stockQuantity),
          minimumStock: Number(formData.minimumStock)
        });
      }
      setIsDrawerOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete product.");
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Product Details",
      accessor: "name",
      render: (product) => (
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleOpenDrawer(product, true)}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-primary text-sm">{product.name}</div>
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              <span>Code: {product.productCode}</span>
              {(product.shelf || product.row) && (
                <span className="text-primary/70 font-bold">
                  • Shelf: {product.shelf || "-"} | Row: {product.row || "-"}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      accessor: "categoryId",
      render: (product) => (
        <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px] font-black uppercase tracking-[0.2em]">
          {product.category?.name || 'Spare Parts'}
        </span>
      )
    },
    {
      header: "Prices",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <>
          {isAdmin && <div className="text-xs font-semibold text-muted-foreground">Cost: ₹{Number(product.purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>}
          <div className="text-sm font-black text-green-600 dark:text-green-400">Sale: ₹{Number(product.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </>
      )
    },
    {
      header: "Stock Level",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (product) => (
        <div className={`inline-flex flex-col items-center justify-center ${product.stockQuantity <= product.minimumStock ? 'text-red-500' : 'text-foreground'}`}>
          <span className="text-lg font-black">{product.stockQuantity}</span>
          {product.stockQuantity <= product.minimumStock && (
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 animate-pulse">Low</span>
          )}
        </div>
      )
    }
  ];

  if (isAdmin) {
    columns.push({
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleOpenDrawer(product, false); }} 
            className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 rounded-lg"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:bg-red-100/50 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmId(product.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    });
  }

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Products & Inventory" 
        description="Manage your shop inventory, spare parts, and accessories."
        action={
          isAdmin && (
            <Button variant="primary" onClick={() => handleOpenDrawer(null, false)}>
              <Plus className="h-5 w-5" /> Add Product
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="card-container border-l-4 border-l-blue-500 py-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Inventory Items</h3>
          <p className="text-3xl font-bold mt-2">{total}</p>
        </div>
        {isAdmin && (
          <div className="card-container border-l-4 border-l-green-500 py-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Stock Value</h3>
            <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
              ₹{products.reduce((acc, p) => acc + (Number(p.purchasePrice) * p.stockQuantity), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
        <div className="card-container border-l-4 border-l-red-500 py-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Low Stock <AlertTriangle className="h-4 w-4 text-red-500" />
          </h3>
          <p className="text-3xl font-bold mt-2 text-red-500">
            {products.filter(p => p.stockQuantity <= p.minimumStock).length}
          </p>
        </div>
      </div>

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        loadingMessage="Loading products..."
        emptyIcon={<Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />}
        emptyMessage="No products found in inventory."
        toolbar={
          <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between bg-muted/10">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-72">
                <Input
                  type="text"
                  placeholder="Search products or parts..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="w-48">
                <select
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        }
        pagination={
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total / limit) || 1} 
            limit={limit}
            onPageChange={setPage} 
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        }
      />

      {/* Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedProduct ? (isReadOnly ? "Product Information" : "Edit Product") : "Add New Product"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : selectedProduct ? "Update Product" : "Save Product"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-10 pb-8">
          {isReadOnly && selectedProduct && (
            <div className="flex gap-6 items-center bg-primary/5 rounded-2xl p-6 border border-primary/10">
               <div className={`p-4 rounded-xl ${formData.stockQuantity <= formData.minimumStock ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                 <Box className="h-8 w-8" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Inventory Level</p>
                 <h4 className="text-2xl font-bold">{formData.stockQuantity} Units <span className="text-sm font-medium text-muted-foreground ml-2">in stock</span></h4>
               </div>
            </div>
          )}

          <div className="space-y-6">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Product Basics</label>
             
             {isReadOnly ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Product Name</p>
                   <p className="text-lg font-bold">{formData.name}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Brand</p>
                     <p className="text-base font-bold">{formData.brand || 'N/A'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Category</p>
                     <p className="text-base font-bold underline decoration-primary/30 underline-offset-4">
                       {categories.find(c => c.id === formData.categoryId)?.name || 'Spare Parts'}
                     </p>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="grid gap-4">
                <Input 
                  label="Product Name" 
                  required 
                  placeholder="e.g. iPhone 13 OLED Display" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: ""});
                  }}
                  error={errors.name}
                  icon={<Tag className="h-4 w-4" />} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Brand" 
                    placeholder="e.g. Apple" 
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                  <SearchableSelect
                    label="Category"
                    required
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    value={formData.categoryId}
                    onChange={(val) => {
                      setFormData({...formData, categoryId: val});
                      if (errors.categoryId) setErrors({...errors, categoryId: ""});
                    }}
                    error={errors.categoryId}
                  />
                </div>
               </div>
             )}
          </div>

          <div className="space-y-6 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Pricing & Stock Levels</label>
             
             {isReadOnly ? (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                 {isAdmin && (
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Purchase Price</p>
                     <p className="text-base font-bold text-muted-foreground">${Number(formData.purchasePrice).toFixed(2)}</p>
                   </div>
                 )}
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Selling Price</p>
                   <p className="text-xl font-bold text-green-600 dark:text-green-400">${Number(formData.sellingPrice).toFixed(2)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Current Stock</p>
                   <p className={`text-base font-bold ${formData.stockQuantity <= formData.minimumStock ? 'text-red-500' : ''}`}>
                     {formData.stockQuantity}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Min. Alert</p>
                   <p className="text-base font-bold">{formData.minimumStock}</p>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Purchase Price" 
                  required 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.purchasePrice}
                  onChange={(e) => {
                    setFormData({...formData, purchasePrice: e.target.value});
                    if (errors.purchasePrice) setErrors({...errors, purchasePrice: ""});
                  }}
                  error={errors.purchasePrice}
                  icon={<DollarSign className="h-4 w-4" />} 
                />
                <Input 
                  label="Selling Price" 
                  required 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.sellingPrice}
                  onChange={(e) => {
                    setFormData({...formData, sellingPrice: e.target.value});
                    if (errors.sellingPrice) setErrors({...errors, sellingPrice: ""});
                  }}
                  error={errors.sellingPrice}
                  icon={<DollarSign className="h-4 w-4" />} 
                />
                <Input 
                  label="Stock Quantity" 
                  required 
                  type="number" 
                  placeholder="0" 
                  value={formData.stockQuantity}
                  onChange={(e) => {
                    setFormData({...formData, stockQuantity: e.target.value});
                    if (errors.stockQuantity) setErrors({...errors, stockQuantity: ""});
                  }}
                  error={errors.stockQuantity}
                  icon={<Box className="h-4 w-4" />} 
                />
                <Input 
                  label="Min. Stock Alert" 
                  required
                  type="number" 
                  placeholder="5" 
                  value={formData.minimumStock}
                  onChange={(e) => {
                    setFormData({...formData, minimumStock: e.target.value});
                    if (errors.minimumStock) setErrors({...errors, minimumStock: ""});
                  }}
                  error={errors.minimumStock}
                  icon={<AlertTriangle className="h-4 w-4" />} 
                />
               </div>
             )}
          </div>

          <div className="space-y-6 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Position / Location</label>
             {isReadOnly ? (
               <div className="grid grid-cols-2 gap-6 px-1">
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Shelf</p>
                   <p className="text-base font-bold">{formData.shelf || 'N/A'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Row</p>
                   <p className="text-base font-bold">{formData.row || 'N/A'}</p>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                 <Input 
                   label="Shelf" 
                   placeholder="e.g. Shelf A" 
                   value={formData.shelf}
                   onChange={(e) => setFormData({...formData, shelf: e.target.value})}
                   icon={<Package className="h-4 w-4" />} 
                 />
                 <Input 
                   label="Row" 
                   placeholder="e.g. Row 5" 
                   value={formData.row}
                   onChange={(e) => setFormData({...formData, row: e.target.value})}
                   icon={<Box className="h-4 w-4" />} 
                 />
               </div>
             )}
          </div>

          <div className="space-y-6 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Additional Details</label>
             {isReadOnly ? (
               <div className="bg-muted/30 rounded-xl p-4 border italic text-muted-foreground text-sm leading-relaxed">
                 {formData.description || 'No description provided.'}
               </div>
             ) : (
               <TextArea 
                 label="Description"
                 placeholder="Enter product specifications or compatibility notes..."
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
               />
             )}
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Inventory Item"
        description="Are you sure you want to remove this item from your inventory? This action is permanent and will affect stock calculations for future repairs."
        confirmText="Delete"
        variant="danger"
        icon="delete"
      />
    </div>
  );
}
