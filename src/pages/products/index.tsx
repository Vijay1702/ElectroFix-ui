import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "@/services/product.service";
import { AlertTriangle, Edit3, Trash, Package, Tag, DollarSign, Upload } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}${url}`;
  } catch (e) {
    return `http://localhost:5000${url}`;
  }
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/inventory", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    stockQuantity: "0",
    minimumStock: "",
    description: "",
    shelf: "",
    row: "",
    imageUrl: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProducts();
    productService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(err => console.error("Failed to fetch categories", err));
  }, [categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(1, 1000, "", categoryFilter);
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Only JPG and PNG are supported.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const data = await productService.uploadImage(file);
      if (data && data.fileUrl) {
        setFormData(prev => ({ ...prev, imageUrl: data.fileUrl }));
      }
    } catch (error) {
      console.error("Failed to upload image", error);
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImage(false);
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
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : "0",
        minimumStock: product.minimumStock !== undefined ? String(product.minimumStock) : "",
        description: product.description || "",
        shelf: product.shelf || "",
        row: product.row || "",
        imageUrl: product.imageUrl || ""
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        brand: "",
        categoryId: "",
        purchasePrice: "",
        sellingPrice: "",
        stockQuantity: "0",
        minimumStock: "",
        description: "",
        shelf: "",
        row: "",
        imageUrl: ""
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Product Name is required";
    } else if (formData.name.length > 200) {
      newErrors.name = "Product Name must be under 200 characters";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be under 1000 characters";
    }
    
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    
    const purchase = Number(formData.purchasePrice);
    if (formData.purchasePrice === "" || isNaN(purchase) || purchase < 0) {
      newErrors.purchasePrice = "Valid cost price is required";
    }
    
    const selling = Number(formData.sellingPrice);
    if (formData.sellingPrice === "" || isNaN(selling) || selling < 0) {
      newErrors.sellingPrice = "Valid selling price is required";
    }
    
    const minStock = Number(formData.minimumStock);
    if (formData.minimumStock === "" || !Number.isInteger(minStock) || minStock < 0) {
      newErrors.minimumStock = "Valid minimum alert level is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    try {
      if (selectedProduct) {
        const { stockQuantity, shelf, row, ...rest } = formData;
        await productService.updateProduct(selectedProduct.id, {
          ...rest,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
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
      toast.success(selectedProduct ? "Product updated successfully" : "Product created successfully");
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setDeleteConfirmId(null);
      fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.response?.data?.message || "Failed to delete product.");
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Product ID",
      accessor: "productCode",
      render: (product) => (
        <button
          className="font-semibold text-primary hover:underline text-sm"
          onClick={() => handleOpenDrawer(product, true)}
        >
          {product.productCode}
        </button>
      )
    },
    {
      header: "Product Name",
      accessor: "name",
      render: (product) => {
        const imageUrl = getImageUrl(product.imageUrl);
        return (
          <div className="flex items-center gap-2.5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-8 w-8 rounded-lg object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Tag className="h-4 w-4" />
              </div>
            )}
            <span className="font-semibold text-foreground text-sm">{product.name}</span>
          </div>
        );
      }
    },
    {
      header: "Category",
      accessor: "categoryId",
      render: (product) => (
        <span className="text-sm text-foreground">{product.category?.name || '-'}</span>
      )
    },
    {
      header: "Brand",
      accessor: "brand",
      render: (product) => (
        <span className="text-sm text-muted-foreground">{product.brand || '-'}</span>
      )
    },
    {
      header: "Selling Price",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <span className="font-semibold text-sm text-foreground">
          ₹{Number(product.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  if (isAdmin) {
    columns.splice(4, 0, {
      header: "Cost Price",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <span className="text-sm text-muted-foreground">
          ₹{Number(product.purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    });

    columns.push({
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenDrawer(product, false); }}
            className="text-indigo-500 hover:text-indigo-600 transition-colors bg-transparent outline-none"
          >
            <Edit3 className="h-[18px] w-[18px] stroke-[2]" />
          </button>
          <button
            className="text-red-500 hover:text-red-600 transition-colors bg-transparent outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmId(product.id);
            }}
          >
            <Trash className="h-[18px] w-[18px] stroke-[2]" />
          </button>
        </div>
      )
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div className="card-container border-l-4 border-l-blue-500 py-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Products</h3>
          <p className="text-3xl font-bold mt-1.5">{products.length}</p>
        </div>
        <div className="card-container border-l-4 border-l-green-500 py-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Categories</h3>
          <p className="text-3xl font-bold mt-1.5">{categories.length}</p>
        </div>
      </div>

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        loadingMessage="Loading products..."
        emptyIcon={<Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />}
        emptyMessage="No products found in catalog."
        title="Products Catalog"
        searchable
        searchPlaceholder="Search products..."
        paginated
        onAddClick={isAdmin ? () => handleOpenDrawer(null, false) : undefined}
        addLabel="Add Product"
        toolbarExtra={
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
          <div className="space-y-6">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Product Basics</label>
             
             {isReadOnly ? (
               <div className="space-y-6">
                 {formData.imageUrl && (
                   <div className="flex justify-center py-2 bg-muted/20 border rounded-2xl">
                     <img 
                       src={getImageUrl(formData.imageUrl)} 
                       alt="Product Preview" 
                       className="max-h-48 rounded-xl object-contain border bg-background"
                     />
                   </div>
                 )}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 px-1">
                   <div className="col-span-2 sm:col-span-3">
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Product Name</p>
                     <p className="text-lg font-bold">{formData.name}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Category</p>
                     <p className="text-base font-bold">
                       {categories.find(c => c.id === formData.categoryId)?.name || 'Spare Parts'}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Brand</p>
                     <p className="text-base font-bold">{formData.brand || 'N/A'}</p>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="grid gap-5">
                  {/* Image Upload Component */}
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Image</label>
                    <div className="flex gap-4 items-center">
                      {formData.imageUrl ? (
                        <div className="relative group h-20 w-20 rounded-xl overflow-hidden border border-border">
                          <img 
                            src={getImageUrl(formData.imageUrl)} 
                            alt="Uploaded preview" 
                            className="h-full w-full object-cover"
                          />
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, imageUrl: ""})}
                            className="absolute inset-0 bg-red-600/80 text-white font-black text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-muted/40 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8 opacity-40" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold bg-background text-foreground hover:bg-muted transition-all">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            onChange={handleImageUpload}
                            className="hidden" 
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">PNG or JPG up to 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Name */}
                  <Input 
                    label="Product Name" 
                    required 
                    placeholder="e.g. Milo 1kg" 
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: ""});
                    }}
                    error={errors.name}
                    icon={<Tag className="h-4 w-4" />} 
                  />

                  {/* Category & Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <Input 
                      label="Brand" 
                      placeholder="e.g. Nestlé" 
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
               </div>
             )}
          </div>

          <div className="space-y-6 pt-6 border-t">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Pricing & Stock Alert</label>
             
             {isReadOnly ? (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-1">
                 {isAdmin && (
                   <div>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Cost Price</p>
                     <p className="text-base font-bold text-muted-foreground">₹{Number(formData.purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                   </div>
                 )}
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Selling Price</p>
                   <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{Number(formData.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Low Alert Level</p>
                   <p className="text-base font-bold">{formData.minimumStock}</p>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Input 
                   label="Cost Price" 
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
                   label="Low Alert (Reorder Level)" 
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
