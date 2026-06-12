import { useEffect, useState } from "react";
import { customerService } from "@/services/customer.service";
import { Edit3, Trash, User, Phone, MapPin, Calendar, Wrench, DollarSign } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isMonitor = userRole === "MONITOR";
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const [startDate, setStartDate] = useState(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatLocalDate(now));

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
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"repairs" | "purchases">("repairs");

  useEffect(() => {
    fetchCustomers();
  }, [startDate, endDate]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers(1, 1000, "", startDate, endDate);
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

  const handleOpenView = async (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewDrawerOpen(true);
    setLoadingHistory(true);
    setCustomerHistory(null);
    try {
      const historyData = await customerService.getCustomerHistory(customer.id);
      setCustomerHistory(historyData);
    } catch (err) {
      console.error("Failed to load customer history", err);
    } finally {
      setLoadingHistory(false);
    }
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
      // Error handled by global interceptor
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
      // Error handled by global interceptor
      setSubmitting(false);
    }
  };

  let columns: Column<any>[] = [
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
        <div className="flex items-center justify-end gap-4">
          <button
            className="text-indigo-500 hover:text-indigo-600 transition-colors bg-transparent outline-none"
            onClick={(e) => { e.stopPropagation(); handleOpenForm(customer); }}
          >
            <Edit3 className="h-[18px] w-[18px] stroke-[2]" />
          </button>
          <button
            className="text-red-500 hover:text-red-600 transition-colors bg-transparent outline-none"
            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
          >
            <Trash className="h-[18px] w-[18px] stroke-[2]" />
          </button>
        </div>
      )
    }
  ];

  if (isMonitor) {
    columns = columns.filter(c => c.header !== "Actions");
  }

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
          onAddClick={isMonitor ? undefined : () => handleOpenForm()}
          addLabel="Add Customer"
          toolbarExtra={
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          }
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
                    <div className="flex items-center justify-end gap-4">
                      <button
                        className="text-indigo-500 hover:text-indigo-600 transition-colors bg-transparent outline-none"
                        onClick={(e) => { e.stopPropagation(); handleOpenForm(customer); }}
                      >
                        <Edit3 className="h-[18px] w-[18px] stroke-[2]" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-600 transition-colors bg-transparent outline-none"
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
                      >
                        <Trash className="h-[18px] w-[18px] stroke-[2]" />
                      </button>
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
                <span className="text-2xl font-bold">
                  {loadingHistory ? (
                    <span className="block h-6 w-12 bg-muted animate-pulse rounded-md" />
                  ) : (
                    customerHistory?.repairJobs?.length || 0
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Repairs</span>
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {loadingHistory ? (
                    <span className="block h-6 w-20 bg-muted animate-pulse rounded-md" />
                  ) : (
                    `₹${(customerHistory?.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Spent</span>
              </div>
            </div>
          </div>

          {/* Detailed History Tabs */}
          <div className="pt-6 border-t">
            <div className="flex border-b border-border/50 gap-4">
              <button
                onClick={() => setActiveTab("repairs")}
                className={cn(
                  "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all outline-none",
                  activeTab === "repairs"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Repair History ({loadingHistory ? "..." : customerHistory?.repairJobs?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("purchases")}
                className={cn(
                  "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all outline-none",
                  activeTab === "purchases"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Purchase Invoices ({loadingHistory ? "..." : customerHistory?.invoices?.length || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
              {loadingHistory ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 w-full bg-muted/20 animate-pulse rounded-2xl border border-dashed border-border/50" />
                  ))}
                </div>
              ) : activeTab === "repairs" ? (
                (!customerHistory?.repairJobs || customerHistory.repairJobs.length === 0) ? (
                  <div className="text-center py-8 text-xs font-bold text-muted-foreground italic bg-muted/5 rounded-2xl border border-dashed border-border/50">
                    No repair jobs recorded for this customer.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {customerHistory.repairJobs.map((job: any) => {
                      const brandModelStr = [job.brand, job.model].filter((val) => val && val !== 'null').join(' ');
                      const deviceDetails = [job.deviceType, brandModelStr ? `(${brandModelStr})` : ''].filter(Boolean).join(' ');
                      return (
                        <div key={job.id} className="p-4 bg-background border border-border/25 rounded-2xl space-y-2 hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-primary">{job.jobNumber}</span>
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="text-xs font-bold text-foreground truncate">{deviceDetails}</div>
                          {job.problemDescription && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 italic bg-muted/10 p-2 rounded-lg">
                              "{job.problemDescription}"
                            </p>
                          )}
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/10 font-bold">
                            <span>Received: {new Date(job.receivedDate).toLocaleDateString('en-IN')}</span>
                            <span className="text-foreground">Cost: ₹{Number(job.estimatedCost || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                (!customerHistory?.invoices || customerHistory.invoices.length === 0) ? (
                  <div className="text-center py-8 text-xs font-bold text-muted-foreground italic bg-muted/5 rounded-2xl border border-dashed border-border/50">
                    No invoices generated for this customer.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {customerHistory.invoices.map((inv: any) => (
                      <div key={inv.id} className="p-4 bg-background border border-border/25 rounded-2xl space-y-2 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-primary">{inv.invoiceNumber}</span>
                          <StatusBadge status={inv.paymentStatus} />
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          Total Amount: <span className="tabular-nums">₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/10 font-bold">
                          <span>Date: {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                          <span className="text-emerald-600">Paid: ₹{Number(inv.paidAmount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
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
