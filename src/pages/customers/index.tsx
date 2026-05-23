import { useEffect, useState } from "react";
import { customerService } from "@/services/customer.service";
import { FileEdit, Trash2, User, Phone, MapPin, Calendar, Wrench, DollarSign } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers(1, 1000, "");
      setCustomers(res.data);
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
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Full Name must be at least 3 characters";
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
    } else if (formData.phoneNumber.trim().length < 10) {
      newErrors.phoneNumber = "Phone Number must be at least 10 characters";
    }
    
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

  const columns: Column<any>[] = [
    {
      header: "Customer ID",
      accessor: "customerCode",
      render: (customer) => (
        <button
          className="font-semibold text-primary hover:underline text-sm"
          onClick={() => handleOpenView(customer)}
        >
          {customer.customerCode}
        </button>
      )
    },
    {
      header: "Full Name",
      accessor: "fullName",
      render: (customer) => (
        <span className="font-semibold text-foreground text-sm">{customer.fullName}</span>
      )
    },
    {
      header: "Phone Number",
      accessor: "phoneNumber",
      render: (customer) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{customer.phoneNumber}</span>
        </div>
      )
    },
    {
      header: "Address",
      accessor: "address",
      render: (customer) => (
        <span className="text-sm text-muted-foreground">{customer.address || '-'}</span>
      )
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (customer) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 rounded-lg"
            onClick={(e) => { e.stopPropagation(); handleOpenForm(customer); }}
          >
            <FileEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-100/50 rounded-lg"
            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="hidden md:block">
        <DataTable
          data={customers}
          columns={columns}
          loading={loading}
          loadingMessage="Loading customers..."
          emptyMessage="No customers found."
          emptyIcon={<User className="h-12 w-12" />}
          title="Customers"
          searchable
          searchPlaceholder="Search by name, phone, address..."
          paginated
          onAddClick={() => handleOpenForm()}
          addLabel="Add Customer"
        />
      </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden p-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-muted-foreground font-medium">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground font-medium">No customers found.</div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div 
                  key={customer.id}
                  className="bg-background border border-border/25 rounded-2xl p-4 shadow-xs space-y-3 cursor-pointer"
                  onClick={() => handleOpenView(customer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                      {customer.fullName?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-foreground truncate">{customer.fullName}</div>
                      <div className="text-[10px] text-primary font-bold">{customer.customerCode}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); handleOpenForm(customer); }}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-100/50 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{customer.phoneNumber}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
          <div className="flex w-full justify-end">
             <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>
               Close Profile
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
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
                <span className="text-2xl font-bold">₹0.00</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Spent</span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer Profile"
        description={`Are you sure you want to delete ${selectedCustomer?.fullName}? This will permanently remove their profile and all associated repair history.`}
        confirmText="Delete"
        variant="danger"
        icon="delete"
      />
    </div>
  );
}
