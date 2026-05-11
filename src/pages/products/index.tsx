import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { Plus, Search, Filter, AlertTriangle, Edit3, Trash2, Package, Tag, DollarSign, Box } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
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
    setSelectedProduct(product);
    setIsDrawerOpen(true);
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
            <Button variant="primary">{selectedProduct ? "Update Product" : "Save Product"}</Button>
          </>
        }
      >
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Product Basics</label>
             <div className="grid gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold">Product Name</span>
                  <Input placeholder="e.g. iPhone 13 OLED Display" defaultValue={selectedProduct?.name} icon={<Tag className="h-4 w-4" />} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <span className="text-xs font-semibold">Brand</span>
                    <Input placeholder="e.g. Apple" defaultValue={selectedProduct?.brand} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold">Category</span>
                    <select className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary appearance-none">
                       <option>Smartphones</option>
                       <option>Laptops</option>
                       <option>Tablets</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Pricing & Stock</label>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold">Purchase Price</span>
                  <Input type="number" placeholder="0.00" defaultValue={selectedProduct?.purchasePrice} icon={<DollarSign className="h-4 w-4" />} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold">Selling Price</span>
                  <Input type="number" placeholder="0.00" defaultValue={selectedProduct?.sellingPrice} icon={<DollarSign className="h-4 w-4" />} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold">Stock Quantity</span>
                  <Input type="number" placeholder="0" defaultValue={selectedProduct?.stockQuantity} icon={<Box className="h-4 w-4" />} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold">Min. Stock Alert</span>
                  <Input type="number" placeholder="5" defaultValue={selectedProduct?.minimumStock} icon={<AlertTriangle className="h-4 w-4" />} />
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Description</label>
             <textarea 
               className="flex w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-none shadow-inner"
               placeholder="Enter product specifications or compatibility notes..."
               defaultValue={selectedProduct?.description}
             />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
