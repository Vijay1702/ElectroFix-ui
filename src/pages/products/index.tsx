import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { Plus, Search, Filter, AlertTriangle, Edit3, Trash2, Package } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your shop inventory, spare parts, and accessories.</p>
        </div>
        <button className="primary-button flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

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
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products or parts..."
                className="input-style w-full pl-9 h-10 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted font-medium transition-colors">
              <Filter className="h-4 w-4" />
              Filter by Category
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Product Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Purchase Price</th>
                <th className="px-6 py-4 font-medium text-right">Selling Price</th>
                <th className="px-6 py-4 font-medium text-center">Stock Level</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{product.name}</div>
                      <div className="text-xs text-muted-foreground">Code: {product.productCode} | Brand: {product.brand || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${Number(product.purchasePrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                      ${Number(product.sellingPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex flex-col items-center justify-center ${product.stockQuantity <= product.minimumStock ? 'text-red-500 font-bold' : 'font-medium'}`}>
                        <span className="text-lg">{product.stockQuantity}</span>
                        {product.stockQuantity <= product.minimumStock && (
                          <span className="text-[10px] uppercase tracking-wider text-red-500 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-muted-foreground hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/10">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit) || 1}
          </span>
          <button 
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
