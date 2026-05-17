import { useEffect, useState } from "react";
import { repairService } from "@/services/repair.service";
import { customerService } from "@/services/customer.service";
import { userService } from "@/services/user.service";
import { Plus, Search, Calendar, Smartphone, CheckCircle2, FileEdit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useAuth } from "@/contexts/AuthContext";

export default function RepairsPage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";
  
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Dropdown States
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [techniciansList, setTechniciansList] = useState<any[]>([]);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    expectedDeliveryDate: "",
    technicianId: "",
    deviceType: "",
    brand: "",
    model: "",
    problemDescription: "",
    status: "not_started",
    estimatedCost: "",
    advanceAmount: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, [page, search, limit, statusFilter]);

  useEffect(() => {
    // Only admins need to fetch the full lists for dropdowns
    if (isAdmin) {
      customerService.getCustomersLookup()
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setCustomersList(data);
        })
        .catch(err => {
          console.error("Failed to fetch customers", err);
          setCustomersList([]);
        });

      userService.getUsersLookup("TECHNICIAN")
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setTechniciansList(data);
        })
        .catch(err => {
          console.error("Failed to fetch technicians", err);
          setTechniciansList([]);
        });
    }
  }, [isAdmin]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const res = await repairService.getRepairs(page, limit, search, statusFilter);
      setRepairs(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch repairs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (repair: any = null, readOnly = false) => {
    setErrors({});
    setIsReadOnly(readOnly);
    if (repair) {
      setSelectedRepair(repair);
      setFormData({
        customerId: repair.customerId || "",
        expectedDeliveryDate: repair.expectedDeliveryDate ? new Date(repair.expectedDeliveryDate).toISOString().split('T')[0] : "",
        technicianId: repair.technicianId || "",
        deviceType: repair.deviceType || "",
        brand: repair.brand || "",
        model: repair.model || "",
        problemDescription: repair.problemDescription || "",
        status: repair.status || "not_started",
        estimatedCost: repair.estimatedCost ? String(repair.estimatedCost) : "",
        advanceAmount: repair.advanceAmount ? String(repair.advanceAmount) : ""
      });
    } else {
      setSelectedRepair(null);
      setFormData({
        customerId: "",
        expectedDeliveryDate: "",
        technicianId: "",
        deviceType: "",
        brand: "",
        model: "",
        problemDescription: "",
        status: "not_started",
        estimatedCost: "",
        advanceAmount: ""
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = "Client Name is required";
    if (!formData.technicianId) newErrors.technicianId = "Assigned To is required";
    if (!formData.deviceType?.trim()) newErrors.deviceType = "Device Type is required";
    if (!formData.problemDescription?.trim()) newErrors.problemDescription = "Problem Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : null,
        advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : null
      };
      if (selectedRepair) {
        await repairService.updateRepair(selectedRepair.id, payload);
      } else {
        await repairService.createRepair(payload);
      }
      setIsDrawerOpen(false);
      fetchRepairs();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repairService.deleteRepairJob(id);
      setDeleteConfirmId(null);
      fetchRepairs();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Job No.",
      accessor: "jobNumber",
      render: (job) => (
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleOpenDrawer(job, true)}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Smartphone className="h-4 w-4" />
          </div>
          <span className="font-bold text-primary">{job.jobNumber}</span>
        </div>
      )
    },
    {
      header: "Device & Issue",
      accessor: "deviceType",
      render: (job) => (
        <>
          <div className="font-bold text-foreground text-sm">{job.deviceType} {job.brand}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate max-w-[150px]">{job.problemDescription}</div>
        </>
      )
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (job) => (
        <>
          <div className="font-semibold text-sm">{job.customer?.fullName || 'Walk-in'}</div>
          <div className="text-[10px] text-muted-foreground font-medium">{job.customer?.phoneNumber || '-'}</div>
        </>
      )
    },
    {
      header: "Estimated Cost",
      accessor: "estimatedCost",
      render: (job) => (
        <span className="text-xs font-black text-foreground">
          {job.estimatedCost ? `₹${Number(job.estimatedCost).toLocaleString('en-IN')}` : "-"}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (job) => <StatusBadge status={job.status} />
    },
    {
      header: "Received",
      accessor: "receivedDate",
      render: (job) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(job.receivedDate).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (job) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-blue-500 hover:bg-blue-100/50 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDrawer(job, false);
            }}
          >
            <FileEdit className="h-4 w-4" />
          </Button>
          {isAdmin && job.status !== "delivered" && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-500 hover:bg-red-100/50 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(job.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader
        title="Repair Jobs"
        description={isAdmin ? "Track and manage all device repair tasks." : "View and update your assigned repair tasks."}
        action={
          isAdmin && (
            <Button variant="primary" onClick={() => handleOpenDrawer(null, false)}>
              <Plus className="h-5 w-5" /> New Repair Job
            </Button>
          )
        }
      />

      <DataTable
        data={repairs}
        columns={columns}
        loading={loading}
        loadingMessage="Loading repair jobs..."
        emptyMessage="No repair jobs found."
        toolbar={
          <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between bg-muted/10">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-72">
                <Input
                  type="text"
                  placeholder="Search job number or device..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="w-48">
                <select
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="not_started">Not Started</option>
                  <option value="work_in_progress">Work in Progress</option>
                  <option value="pending_to_deliver">Pending to Deliver</option>
                  <option value="delivered">Delivered</option>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Repair Ticket"
        description="Are you sure you want to delete this repair ticket? This action is permanent and will remove all associated history and invoices."
        confirmText="Delete"
        variant="danger"
        icon="delete"
      />

      {/* Repair Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedRepair ? (isReadOnly ? "Repair Details" : "Edit Repair Job") : "New Repair Job"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : selectedRepair ? "Update Job" : "Create Job"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-8">
          {/* Header Info */}
          <div className="bg-muted/20 p-6 rounded-3xl border border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Smartphone className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedRepair ? selectedRepair.jobNumber : "New Job Ticket"}</h3>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Device Repair Entry</p>
              </div>
            </div>
            {selectedRepair && <StatusBadge status={selectedRepair.status} />}
          </div>

          {isReadOnly && selectedRepair && (
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Current Progress</p>
                <h4 className="text-xl font-bold capitalize">{formData.status.replace(/_/g, ' ')}</h4>
              </div>
              <StatusBadge status={formData.status} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Customer & Delivery</label>
                
                {isReadOnly ? (
                  <div className="space-y-4 px-1">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Client Name</p>
                      <p className="text-base font-bold">{customersList.find(c => c.id === formData.customerId)?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Expected Delivery</p>
                      <p className="text-base font-bold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <SearchableSelect
                      label="Client Name"
                      required
                      options={customersList.map(c => ({ value: c.id, label: c.fullName }))}
                      value={formData.customerId}
                      onChange={(val) => {
                        setFormData({ ...formData, customerId: val });
                        if (errors.customerId) setErrors({ ...errors, customerId: "" });
                      }}
                      error={errors.customerId}
                      disabled={!isAdmin}
                    />
                    <Input
                      label="Expected Delivery"
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                      icon={<Calendar className="h-4 w-4" />}
                      disabled={!isAdmin}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-6 border-t">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Assignment & Status</label>
                
                {isReadOnly ? (
                  <div className="space-y-4 px-1">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Technician Assigned</p>
                      <p className="text-base font-bold">{techniciansList.find(t => t.id === formData.technicianId)?.fullName || 'Unassigned'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <SearchableSelect
                      label="Assigned To"
                      required
                      options={techniciansList.map(t => ({ value: t.id, label: t.fullName }))}
                      value={formData.technicianId}
                      onChange={(val) => {
                        setFormData({ ...formData, technicianId: val });
                        if (errors.technicianId) setErrors({ ...errors, technicianId: "" });
                      }}
                      error={errors.technicianId}
                      disabled={!isAdmin}
                    />
                    {selectedRepair && (
                      <SearchableSelect
                        label="Current Status"
                        options={[
                          { value: "not_started", label: "Not Started" },
                          { value: "work_in_progress", label: "Work in Progress" },
                          { value: "pending_to_deliver", label: "Pending to Deliver" },
                          { value: "delivered", label: "Delivered" },
                        ]}
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Device Details</label>
                
                {isReadOnly ? (
                  <div className="space-y-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Device Type</p>
                        <p className="text-base font-bold">{formData.deviceType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Brand</p>
                        <p className="text-base font-bold">{formData.brand || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Model Name/Number</p>
                      <p className="text-base font-bold">{formData.model || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Estimated Cost</p>
                        <p className="text-base font-bold">{formData.estimatedCost ? `₹${Number(formData.estimatedCost).toLocaleString('en-IN')}` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Advance Collected</p>
                        <p className="text-base font-bold">{formData.advanceAmount ? `₹${Number(formData.advanceAmount).toLocaleString('en-IN')}` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Device Type"
                        required
                        placeholder="e.g. Smartphone"
                        value={formData.deviceType}
                        onChange={(e) => {
                          setFormData({ ...formData, deviceType: e.target.value });
                          if (errors.deviceType) setErrors({ ...errors, deviceType: "" });
                        }}
                        error={errors.deviceType}
                        disabled={!isAdmin}
                      />
                      <Input
                        label="Brand"
                        placeholder="e.g. Apple"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <Input
                      label="Model Name/Number"
                      placeholder="e.g. iPhone 13 Pro"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      disabled={!isAdmin}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Estimated Cost (₹)"
                        type="number"
                        placeholder="e.g. 2500"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                        disabled={!isAdmin}
                      />
                      <Input
                        label="Advance Paid (₹)"
                        type="number"
                        placeholder="e.g. 500"
                        value={formData.advanceAmount}
                        onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-6 border-t">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Problem Analysis</label>
                
                {isReadOnly ? (
                  <div className="bg-muted/30 rounded-xl p-4 border italic text-muted-foreground text-sm leading-relaxed">
                    "{formData.problemDescription}"
                  </div>
                ) : (
                  <TextArea
                    label="Problem Description"
                    required
                    placeholder="Describe the issue in detail..."
                    value={formData.problemDescription}
                    onChange={(e) => {
                      setFormData({ ...formData, problemDescription: e.target.value });
                      if (errors.problemDescription) setErrors({ ...errors, problemDescription: "" });
                    }}
                    error={errors.problemDescription}
                    disabled={!isAdmin}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Timeline/History (Static for now) */}
          <div className="space-y-4 pt-6 border-t">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Job Progress Timeline</label>
            <div className="space-y-4 px-2">
              <div className="flex gap-4 relative">
                <div className="absolute left-[9px] top-5 bottom-0 w-[2px] bg-border/50" />
                <div className="z-10 bg-green-500 rounded-full h-5 w-5 flex items-center justify-center border-4 border-background">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Ticket Received</p>
                  <p className="text-xs text-muted-foreground">{selectedRepair ? new Date(selectedRepair.receivedDate).toLocaleString() : "-"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="z-10 bg-muted-foreground/20 rounded-full h-5 w-5 flex items-center justify-center border-4 border-background" />
                <div>
                  <p className="text-sm font-bold text-muted-foreground">Waiting for Technician Assignment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
