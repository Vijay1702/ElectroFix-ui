import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { Plus, Search, Filter, AlertTriangle, Edit3, Trash2, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

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

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Products & Inventory" 
        description="Manage your shop inventory, spare parts, and accessories."
        action={
          <Button variant="primary">
            <Plus className="h-5 w-5" /> Add Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="card-container border-l-4 border-l-blue-500 py-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Inventory Items</h3>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </div>
        <div className="card-container border-l-4 border-l-green-500 py-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Stock Value</h3>
          <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
            ${products.reduce((acc, p) => acc + (Number(p.purchasePrice) * p.stockQuantity), 0).toFixed(2)}
          </p>
        </div>
        <div className="card-container border-l-4 border-l-red-500 py-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Low Stock Alerts <AlertTriangle className="h-4 w-4 text-red-500" />
          </h3>
          <p className="text-2xl font-bold mt-1 text-red-500">
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
            <Button variant="outline">
              <Filter className="h-4 w-4" /> Filter by Category
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  No products found in inventory.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-bold text-primary">{product.name}</div>
                    <div className="text-xs text-muted-foreground">Code: {product.productCode} | Brand: {product.brand || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">${Number(product.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                    ${Number(product.sellingPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`inline-flex flex-col items-center justify-center ${product.stockQuantity <= product.minimumStock ? 'text-red-500 font-bold' : 'font-medium'}`}>
                      <span className="text-lg">{product.stockQuantity}</span>
                      {product.stockQuantity <= product.minimumStock && (
                        <span className="text-[10px] uppercase tracking-wider text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
