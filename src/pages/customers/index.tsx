import { useEffect, useState } from "react";
import { customerService } from "@/services/customer.service";
import { Plus, Search, FileEdit, Trash2, Eye, User, Phone, MapPin, Notebook } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Modal } from "@/components/shared/Modal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

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
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleOpenView = (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      setIsFormModalOpen(false);
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
              placeholder="Search customers..." 
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
                  <TableCell className="font-medium text-primary">{customer.customerCode}</TableCell>
                  <TableCell className="font-semibold">{customer.fullName}</TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{customer.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenView(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleOpenDelete(customer)}
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
          onPageChange={setPage} 
        />
      </div>

      {/* Form Modal (Create/Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : selectedCustomer ? "Update Customer" : "Create Customer"}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input 
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              icon={<User className="h-4 w-4" />}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input 
              placeholder="e.g. +1 234 567 890"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <textarea 
              className="flex w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
              placeholder="Street, City, Postal Code"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <textarea 
              className="flex w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
              placeholder="Any special instructions or details..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
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
              This action cannot be undone and will remove all associated history.
            </p>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Customer Profile"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {selectedCustomer?.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedCustomer?.fullName}</h3>
                <p className="text-primary font-medium">{selectedCustomer?.customerCode}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Phone</p>
                  <p className="font-medium">{selectedCustomer?.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Address</p>
                  <p className="font-medium">{selectedCustomer?.address || "No address provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Notebook className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Internal Notes</p>
                  <p className="font-medium text-sm italic text-muted-foreground">{selectedCustomer?.notes || "No notes recorded"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Quick Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <p className="text-xs text-muted-foreground font-bold">Total Repairs</p>
                <p className="text-2xl font-bold text-primary">0</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                <p className="text-xs text-muted-foreground font-bold">Total Spent</p>
                <p className="text-2xl font-bold text-green-600">$0.00</p>
              </div>
            </div>
            <div className="mt-6">
               <p className="text-xs text-muted-foreground font-bold uppercase mb-2">Member Since</p>
               <p className="font-medium">{selectedCustomer ? new Date(selectedCustomer.createdAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
