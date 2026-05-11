import { useEffect, useState } from "react";
import { customerService } from "@/services/customer.service";
import { Plus, Search, FileEdit, Trash2, Eye, User, Phone, MapPin, Calendar, Wrench, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Modal } from "@/components/shared/Modal";
import { Drawer } from "@/components/shared/Drawer";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Sidebar/Drawer States
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, [page, search, limit]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers(page, limit, search);
      setCustomers(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (customer: any = null) => {
    setErrors({});
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        address: customer.address || "",
        notes: customer.notes || ""
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        fullName: "",
        phoneNumber: "",
        address: "",
        notes: ""
      });
    }
    setIsFormDrawerOpen(true);
  };

  const handleOpenView = (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      setIsFormDrawerOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save customer data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      await customerService.deleteCustomer(selectedCustomer.id);
      setIsDeleteModalOpen(false);
      setIsViewDrawerOpen(false); // Close view if delete from there
      fetchCustomers();
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Customers" 
        description="Manage your customer database and repair history."
        action={
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus className="h-5 w-5" /> Add Customer
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/10">
          <div className="w-72">
            <Input 
              type="text" 
              placeholder="Search by name, phone, address..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Total {total} customers
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Address</TableHead>
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
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell 
                    className="font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => handleOpenView(customer)}
                  >
                    {customer.customerCode}
                  </TableCell>
                  <TableCell className="font-semibold">{customer.fullName}</TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{customer.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => handleOpenForm(customer)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
                      >
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

      {/* Form Drawer (Create/Edit Sidebar) */}
      <Drawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={selectedCustomer ? "Edit Customer Details" : "Create New Customer"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : selectedCustomer ? "Update Profile" : "Add Customer"}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Information</label>
            <div className="space-y-4 pt-2">
              <Input 
                label="Full Name"
                required
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({...formData, fullName: e.target.value});
                  if (errors.fullName) setErrors({...errors, fullName: ""});
                }}
                error={errors.fullName}
                icon={<User className="h-4 w-4" />}
              />
              <Input 
                label="Phone Number"
                required
                placeholder="e.g. +91 98400 12345"
                value={formData.phoneNumber}
                onChange={(e) => {
                  setFormData({...formData, phoneNumber: e.target.value});
                  if (errors.phoneNumber) setErrors({...errors, phoneNumber: ""});
                }}
                error={errors.phoneNumber}
                icon={<Phone className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Location & Notes</label>
            <div className="space-y-4 pt-2">
              <TextArea 
                label="Billing Address"
                placeholder="Street, City, Postal Code"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
              <TextArea 
                label="Internal Notes"
                placeholder="Any special instructions or details..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Drawer>

      {/* View Drawer (Sidebar Details) */}
      <Drawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title="Customer Profile"
        size="md"
        footer={
          <div className="flex w-full justify-between items-center">
             <Button 
               variant="ghost" 
               className="text-destructive hover:bg-destructive/10"
               onClick={() => setIsDeleteModalOpen(true)}
             >
               <Trash2 className="h-4 w-4 mr-2" /> Delete
             </Button>
             <Button variant="outline" onClick={() => handleOpenForm(selectedCustomer)}>
               <FileEdit className="h-4 w-4 mr-2" /> Edit Profile
             </Button>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="flex flex-col items-center text-center gap-4 bg-muted/20 p-8 rounded-3xl border border-border/50">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary shadow-inner">
              {selectedCustomer?.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{selectedCustomer?.fullName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-widest uppercase">
                  {selectedCustomer?.customerCode}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-2">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                 <p className="text-sm font-medium flex items-center gap-2">
                   <Phone className="h-3.5 w-3.5 text-primary" /> {selectedCustomer?.phoneNumber}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Since</p>
                 <p className="text-sm font-medium flex items-center gap-2">
                   <Calendar className="h-3.5 w-3.5 text-primary" /> 
                   {selectedCustomer ? new Date(selectedCustomer.createdAt).toLocaleDateString() : '-'}
                 </p>
               </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</p>
              <p className="text-sm font-medium flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary mt-1" /> {selectedCustomer?.address || "No address provided"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Notes</p>
              <p className="text-sm font-medium italic text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-2xl border border-dashed">
                {selectedCustomer?.notes || "No additional notes recorded for this customer."}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
                <Wrench className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-bold">0</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Repairs</span>
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">$0.00</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Spent</span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal (Kept as modal as it's a small confirmation) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Customer"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
            <Trash2 className="h-8 w-8" />
          </div>
          <div>
            <p className="font-bold text-lg">Are you absolutely sure?</p>
            <p className="text-muted-foreground">
              You are about to delete <span className="font-semibold text-foreground">{selectedCustomer?.fullName}</span>. 
              This will remove all associated history.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
