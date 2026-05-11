import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { Plus, Search, Filter, AlertTriangle, Edit3, Trash2, Package, Tag, DollarSign, Box } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { Label } from "@/components/shared/Label";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Drawer } from "@/components/shared/Drawer";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
    minimumStock: "",
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, search, limit]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(page, limit, search);
      setProducts(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (product: any = null) => {
    setErrors({});
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
        description: product.description || ""
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
        description: ""
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = "Product Name is required";
    if (!formData.purchasePrice) newErrors.purchasePrice = "Purchase Price is required";
    if (!formData.sellingPrice) newErrors.sellingPrice = "Selling Price is required";
    if (!formData.stockQuantity) newErrors.stockQuantity = "Stock Quantity is required";
    
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

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Products & Inventory" 
        description="Manage your shop inventory, spare parts, and accessories."
        action={
          <Button variant="primary" onClick={() => handleOpenDrawer()}>
            <Plus className="h-5 w-5" /> Add Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="card-container border-l-4 border-l-blue-500 py-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Inventory Items</h3>
          <p className="text-3xl font-bold mt-2">{total}</p>
        </div>
        <div className="card-container border-l-4 border-l-green-500 py-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Stock Value</h3>
          <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
            ${products.reduce((acc, p) => acc + (Number(p.purchasePrice) * p.stockQuantity), 0).toFixed(2)}
          </p>
        </div>
        <div className="card-container border-l-4 border-l-red-500 py-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Low Stock <AlertTriangle className="h-4 w-4 text-red-500" />
          </h3>
          <p className="text-3xl font-bold mt-2 text-red-500">
            {products.filter(p => p.stockQuantity <= p.minimumStock).length}
          </p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[400px]">
        {/* Toolbar */}
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
            <Button variant="outline" className="hidden sm:flex">
              <Filter className="h-4 w-4" /> Category Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Prices</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  No products found in inventory.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-bold text-primary">{product.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Code: {product.productCode} | Brand: {product.brand || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 bg-secondary/50 text-secondary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {product.category?.name || 'Spare Parts'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-xs font-medium text-muted-foreground">P: ${Number(product.purchasePrice).toFixed(2)}</div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">S: ${Number(product.sellingPrice).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`inline-flex flex-col items-center justify-center ${product.stockQuantity <= product.minimumStock ? 'text-red-500' : 'text-foreground'}`}>
                      <span className="text-lg font-bold">{product.stockQuantity}</span>
                      {product.stockQuantity <= product.minimumStock && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">Alert</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDrawer(product)} className="text-blue-500 hover:bg-blue-50">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
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

      {/* Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedProduct ? "Edit Product" : "Add New Product"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : selectedProduct ? "Update Product" : "Save Product"}
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Product Basics</label>
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
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <select 
                      className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    >
                       <option value="">Select Category...</option>
                       <option value="1">Smartphones</option>
                       <option value="2">Laptops</option>
                       <option value="3">Tablets</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Pricing & Stock</label>
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
                  type="number" 
                  placeholder="5" 
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({...formData, minimumStock: e.target.value})}
                  icon={<AlertTriangle className="h-4 w-4" />} 
                />
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
             <TextArea 
               label="Description"
               placeholder="Enter product specifications or compatibility notes..."
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
             />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
