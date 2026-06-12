import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { repairService } from "@/services/repair.service";
import { customerService } from "@/services/customer.service";
import { userService } from "@/services/user.service";
import { Calendar, Smartphone, CheckCircle2, Edit3, Trash, Phone, Clock } from "lucide-react";

import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

import { useAuth } from "@/contexts/AuthContext";

export default function RepairsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";
  const isMonitor = userRole === "MONITOR";
  
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const [startDate, setStartDate] = useState(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatLocalDate(now));

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
    jobNumber: "",
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

  // Call Log States
  const [isCallLogModalOpen, setIsCallLogModalOpen] = useState(false);
  const [selectedRepairForCall, setSelectedRepairForCall] = useState<any>(null);
  const [callOutcome, setCallOutcome] = useState("informed_fault");
  const [callNotes, setCallNotes] = useState("");
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [isLoggingCall, setIsLoggingCall] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, startDate, endDate]);

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
      const res = await repairService.getRepairs(1, 1000, "", statusFilter, startDate, endDate);
      setRepairs(res.data);
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
        jobNumber: repair.jobNumber || "",
        deviceType: repair.deviceType || "",
        brand: repair.brand || "",
        model: repair.model || "",
        problemDescription: repair.problemDescription || "",
        status: repair.status || "not_started",
        estimatedCost: repair.estimatedCost ? String(repair.estimatedCost) : "",
        advanceAmount: repair.advanceAmount ? String(repair.advanceAmount) : ""
      });
      if (readOnly) {
        fetchCallLogsForRepair(repair.id);
      }
    } else {
      setSelectedRepair(null);
      setFormData({
        customerId: "",
        expectedDeliveryDate: "",
        technicianId: "",
        jobNumber: "",
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

  const fetchCallLogsForRepair = async (id: string) => {
    setLoadingCallLogs(true);
    try {
      const logs = await repairService.getCallLogs(id);
      setCallLogs(logs);
    } catch (err) {
      console.error("Failed to fetch call logs", err);
      setCallLogs([]);
    } finally {
      setLoadingCallLogs(false);
    }
  };

  const handleOpenCallLogModal = (repair: any) => {
    setSelectedRepairForCall(repair);
    setCallOutcome("informed_fault");
    setCallNotes("");
    setIsCallLogModalOpen(true);
  };

  const handleLogCallSubmit = async () => {
    if (!selectedRepairForCall) return;
    setIsLoggingCall(true);
    try {
      await repairService.logCall(selectedRepairForCall.id, {
        outcome: callOutcome,
        notes: callNotes.trim() || undefined
      });
      setIsCallLogModalOpen(false);
      
      if (isDrawerOpen && selectedRepair && selectedRepair.id === selectedRepairForCall.id) {
        fetchCallLogsForRepair(selectedRepair.id);
      }
      
      fetchRepairs();
    } catch (err) {
      console.error("Failed to log call", err);
    } finally {
      setIsLoggingCall(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.jobNumber?.trim()) newErrors.jobNumber = "Job Number is required";
    if (!formData.customerId) newErrors.customerId = "Client Name is required";
    if (!formData.technicianId) newErrors.technicianId = "Assigned To is required";
    if (!formData.deviceType?.trim()) newErrors.deviceType = "Device Type is required";
    if (!formData.problemDescription?.trim()) newErrors.problemDescription = "Problem Description is required";
    if (!formData.estimatedCost || isNaN(Number(formData.estimatedCost)) || Number(formData.estimatedCost) < 0) {
      newErrors.estimatedCost = "Estimated Cost is required and must be positive";
    }

    if (formData.advanceAmount && (isNaN(Number(formData.advanceAmount)) || Number(formData.advanceAmount) < 0)) {
      newErrors.advanceAmount = "Advance Paid must be positive";
    } else if (Number(formData.advanceAmount || 0) >= Number(formData.estimatedCost || 0)) {
      newErrors.advanceAmount = "Advance Paid must be less than Estimated Cost";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        estimatedCost: Number(formData.estimatedCost),
        advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : undefined
      };
      
      if (!payload.technicianId) delete payload.technicianId;
      if (!payload.expectedDeliveryDate) delete payload.expectedDeliveryDate;
      if (!payload.brand) delete payload.brand;
      if (!payload.model) delete payload.model;
      
      let createdJob: any = null;
      if (selectedRepair) {
        await repairService.updateRepair(selectedRepair.id, payload);
      } else {
        createdJob = await repairService.createRepair(payload);
      }
      setIsDrawerOpen(false);
      fetchRepairs();
      
      if (!selectedRepair && createdJob && payload.advanceAmount && payload.advanceAmount > 0) {
        navigate("/invoices", { 
          state: { 
            autoOpenCreate: false, 
            highlightJobNumber: createdJob.jobNumber,
            highlightJobId: createdJob.id,
            message: `Advance Invoice automatically generated for Job #${createdJob.jobNumber}!`
          } 
        });
      }
    } catch (error: any) {
      console.error("Save failed", error);
      // Error is handled globally by axios interceptor
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

  const renderCallStatusBadge = (callStatus: string) => {
    const statusColors: any = {
      pending: "bg-gray-100 text-gray-700 border-gray-200",
      informed: "bg-indigo-50 text-indigo-700 border-indigo-200",
      declined_by_client: "bg-red-50 text-red-700 border-red-200",
      no_response: "bg-amber-50 text-amber-700 border-amber-200",
    };

    const statusLabels: any = {
      pending: "Pending Contact",
      informed: "Fault Informed",
      declined_by_client: "Declined by Client",
      no_response: "No Response",
    };

    const val = callStatus || "pending";

    return (
      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border inline-flex items-center justify-center shrink-0 ${statusColors[val] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
        {statusLabels[val] || val}
      </span>
    );
  };

  let columns: Column<any>[] = [
    {
      header: "Job No.",
      accessor: "jobNumber",
      render: (job) => (
        <button
          className="font-semibold text-primary hover:underline text-sm"
          onClick={() => handleOpenDrawer(job, true)}
        >
          {job.jobNumber}
        </button>
      )
    },
    {
      header: "Device & Issue",
      render: (job) => (
        <div className="flex flex-col gap-0.5 max-w-[200px]">
          <span className="font-semibold text-foreground text-sm">
            {job.deviceType}{job.brand ? ` - ${job.brand}` : ''}
          </span>
          <span className="text-xs text-muted-foreground truncate block" title={job.problemDescription}>
            {job.problemDescription}
          </span>
        </div>
      )
    },
    {
      header: "Customer",
      render: (job) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm text-foreground">
            {job.customer?.fullName || 'Walk-in'}
          </span>
          {job.customer?.phoneNumber && (
            <span className="text-xs text-muted-foreground block">
              {job.customer.phoneNumber}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Est. Cost",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (job) => {
        const estCost = Number(job.estimatedCost || 0);
        const productCost = job.invoices?.reduce((sum: number, inv: any) => sum + (inv.items?.filter((i: any) => i.itemType !== 'REPAIR' && i.itemType !== 'SERVICE').reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0) || 0), 0) || 0;
        const paid = job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0;
        const totalDue = estCost + productCost;
        const balance = Math.max(0, totalDue - paid);
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold text-foreground tabular-nums">₹{estCost.toLocaleString('en-IN')}</span>
            <span className={`text-xs tabular-nums ${balance === 0 ? 'text-green-600' : 'text-amber-600'}`}>
              Bal: ₹{balance.toLocaleString('en-IN')}
            </span>
          </div>
        );
      }
    },
    {
      header: "Contact Status",
      accessor: "callStatus",
      render: (job) => renderCallStatusBadge(job.callStatus)
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
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(job.receivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (job) => (
        <div className="flex items-center justify-end gap-4">
          {job.status === "not_started" && (
            <button
              className="text-emerald-500 hover:text-emerald-600 transition-colors bg-transparent outline-none"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCallLogModal(job);
              }}
            >
              <Phone className="h-[18px] w-[18px] stroke-[2]" />
            </button>
          )}
          {job.status !== "delivered" && (
            <button
              className="text-indigo-500 hover:text-indigo-600 transition-colors bg-transparent outline-none"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDrawer(job, false);
              }}
            >
              <Edit3 className="h-[18px] w-[18px] stroke-[2]" />
            </button>
          )}
          {isAdmin && job.status !== "delivered" && (
            <button
              className="text-red-500 hover:text-red-600 transition-colors bg-transparent outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(job.id);
              }}
            >
              <Trash className="h-[18px] w-[18px] stroke-[2]" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (isMonitor) {
    columns = columns.filter(c => c.header !== "Actions");
  }

  return (<>
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          data={repairs}
          columns={columns}
          loading={loading}
          loadingMessage="Loading repair jobs..."
          emptyMessage="No repair jobs found."
          title="Repair Jobs"
          searchable
          searchPlaceholder="Search job number, device, or customer..."
          paginated
          onAddClick={!isMonitor && isAdmin ? () => handleOpenDrawer(null, false) : undefined}
          addLabel="New Repair Job"
          toolbarExtra={
            <div className="flex items-center gap-1.5">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
              <select
                className="h-9 px-2 rounded-xl border border-border/60 bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="work_in_progress">Work in Progress</option>
                <option value="pending_to_deliver">Pending to Deliver</option>
                <option value="delivered">Delivered</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          }
        />
      </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden p-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-muted-foreground font-medium">Loading repair jobs...</div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground font-medium">No repair jobs found.</div>
          ) : (
            <div className="space-y-3">
              {repairs.map((job) => {
                const estCost = Number(job.estimatedCost || 0);
                const productCost = job.invoices?.reduce((sum: number, inv: any) => sum + (inv.items?.filter((i: any) => i.itemType !== 'REPAIR' && i.itemType !== 'SERVICE').reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0) || 0), 0) || 0;
                const paid = job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0;
                const totalDue = estCost + productCost;
                const balance = Math.max(0, totalDue - paid);
                return (
                  <div
                    key={job.id}
                    className="bg-background border border-border/25 rounded-2xl p-4 shadow-xs space-y-3 cursor-pointer"
                    onClick={() => handleOpenDrawer(job, true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm text-primary">{job.jobNumber}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{job.deviceType} {job.brand}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={job.status} />
                        {renderCallStatusBadge(job.callStatus)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{job.customer?.fullName || 'Walk-in'}</span>
                      <span className="text-muted-foreground">{job.customer?.phoneNumber || ''}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/10 text-center">
                      <div className="bg-muted/5 rounded-xl p-2">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase block">Total</span>
                        <span className="text-xs font-bold text-foreground">₹{estCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-2">
                        <span className="text-[8px] font-bold text-emerald-600 uppercase block">Paid</span>
                        <span className="text-xs font-bold text-emerald-600">₹{paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`rounded-xl p-2 border ${balance === 0 ? 'bg-emerald-500/[0.03] border-emerald-500/10' : 'bg-amber-500/[0.03] border-amber-500/10'}`}>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase block">Balance</span>
                        <span className={`text-xs font-bold ${balance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>₹{balance.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-border/50">
                      {job.status === "not_started" && (
                        <button
                          className="text-emerald-500 hover:text-emerald-600 transition-colors bg-transparent outline-none"
                          onClick={(e) => { e.stopPropagation(); handleOpenCallLogModal(job); }}
                        >
                          <Phone className="h-[18px] w-[18px] stroke-[2]" />
                        </button>
                      )}
                      {job.status !== "delivered" && (
                        <button
                          className="text-indigo-500 hover:text-indigo-600 transition-colors bg-transparent outline-none"
                          onClick={(e) => { e.stopPropagation(); handleOpenDrawer(job, false); }}
                        >
                          <Edit3 className="h-[18px] w-[18px] stroke-[2]" />
                        </button>
                      )}
                      {isAdmin && job.status !== "delivered" && (
                        <button
                          className="text-red-500 hover:text-red-600 transition-colors bg-transparent outline-none"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(job.id); }}
                        >
                          <Trash className="h-[18px] w-[18px] stroke-[2]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-4">







          </div>
        </div>
      </div>

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
            {selectedRepair && (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                <StatusBadge status={selectedRepair.status} />
                {renderCallStatusBadge(selectedRepair.callStatus)}
              </div>
            )}
          </div>

          {isReadOnly && selectedRepair && (
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Current Progress</p>
                <h4 className="text-xl font-bold capitalize">{formData.status.replace(/_/g, ' ')}</h4>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <StatusBadge status={formData.status} />
                {renderCallStatusBadge(selectedRepair.callStatus)}
              </div>
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
                      options={customersList.map(c => ({ value: c.id, label: c.phoneNumber ? `${c.fullName} (${c.phoneNumber})` : c.fullName }))}
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
                          { value: "declined", label: "Declined" },
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
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Job Number</p>
                        <p className="text-base font-bold">{formData.jobNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Device Type</p>
                        <p className="text-base font-bold">{formData.deviceType}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Brand</p>
                        <p className="text-base font-bold">{formData.brand || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Model Name/Number</p>
                        <p className="text-base font-bold">{formData.model || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <Input
                      label="Job Number"
                      required
                      placeholder="e.g. REP-001"
                      value={formData.jobNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, jobNumber: e.target.value.toUpperCase() });
                        if (errors.jobNumber) setErrors({ ...errors, jobNumber: "" });
                      }}
                      error={errors.jobNumber}
                      disabled={!!selectedRepair && !isAdmin}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Estimated Cost (₹) *"
                        type="number"
                        placeholder="e.g. 2500"
                        value={formData.estimatedCost}
                        onChange={(e) => {
                          setFormData({ ...formData, estimatedCost: e.target.value });
                          if (errors.estimatedCost) setErrors({ ...errors, estimatedCost: "" });
                        }}
                        error={errors.estimatedCost}
                        required
                        disabled={!isAdmin}
                      />
                      <Input
                        label="Advance Paid (₹)"
                        type="number"
                        placeholder="e.g. 500"
                        value={formData.advanceAmount}
                        onChange={(e) => {
                          setFormData({ ...formData, advanceAmount: e.target.value });
                          if (errors.advanceAmount) setErrors({ ...errors, advanceAmount: "" });
                        }}
                        error={errors.advanceAmount}
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

          {isReadOnly && selectedRepair && (
            <div className="space-y-4 pt-6 border-t">
              {(() => {
                const estCost = Number(formData.estimatedCost || 0);
                const productCost = selectedRepair?.invoices?.reduce((sum: number, inv: any) => sum + (inv.items?.filter((i: any) => i.itemType !== 'REPAIR' && i.itemType !== 'SERVICE').reduce((s: number, i: any) => s + Number(i.totalPrice || 0), 0) || 0), 0) || 0;
                const paid = selectedRepair?.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0;
                const productBalance = Math.max(0, productCost - paid);
                const repairPayment = Math.max(0, paid - productCost);
                const repairBalance = Math.max(0, estCost - repairPayment);
                
                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <h4 className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">Payment History & Balance</h4>
                      <div className="flex items-center gap-6 sm:gap-8 text-right">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Job Cost</p>
                          <p className="text-sm font-black text-foreground">₹{(estCost + productCost).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Remaining Balance</p>
                          <p className="text-lg font-black text-amber-600">₹{(productBalance + repairBalance).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedRepair?.invoices?.length > 0 ? (
                      <div className="border border-border/50 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-muted/30 border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date & Time</th>
                              <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Details</th>
                              <th className="px-4 py-3 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bill Total</th>
                              <th className="px-4 py-3 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest">Paid</th>
                              <th className="px-4 py-3 text-right text-[10px] font-black text-amber-600 uppercase tracking-widest">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {selectedRepair.invoices.map((inv: any) => {
                              const invTotal = Number(inv.grandTotal || 0);
                              const invPaid = Number(inv.paidAmount || 0);
                              const invBal = Math.max(0, invTotal - invPaid);
                              return (
                                <tr key={inv.id} className="hover:bg-muted/5 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="text-xs font-bold text-foreground">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground">{new Date(inv.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-[10px] font-bold text-primary mb-1">{inv.invoiceNumber}</p>
                                    <div className="flex flex-wrap gap-1">
                                      {inv.items?.map((item: any, idx: number) => (
                                        <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground uppercase">
                                          {item.itemType === 'REPAIR' || item.itemType === 'SERVICE' ? 'Service' : 'Product'}: {item.itemName}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-foreground tabular-nums">₹{invTotal.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600 tabular-nums">₹{invPaid.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-3 text-right text-xs font-bold text-amber-600 tabular-nums">₹{invBal.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-muted/5 p-4 rounded-2xl border border-border/50 text-center">
                        <p className="text-xs font-bold text-muted-foreground">No payments recorded yet.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

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

          {/* Customer Call Logs History */}
          {isReadOnly && selectedRepair && (
            <div className="space-y-4 pt-6 border-t animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Customer Call & Discussion Logs</label>
                {selectedRepair?.status === "not_started" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenCallLogModal(selectedRepair)}
                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest gap-1 rounded-xl"
                  >
                    <Phone className="h-3 w-3" /> Log Call
                  </Button>
                )}
              </div>

              <div className="space-y-4 px-2 pt-2">
                {loadingCallLogs ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 w-full bg-muted/20 animate-pulse rounded-2xl border border-dashed border-border/50" />
                    ))}
                  </div>
                ) : callLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs font-bold text-muted-foreground italic bg-muted/5 rounded-2xl border border-dashed border-border/50">
                    No communication logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {callLogs.map((log) => {
                      const outcomeColors: any = {
                        informed_fault: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                        no_response: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        declined_repair: "bg-red-500/10 text-red-500 border-red-500/20",
                        custom: "bg-teal-500/10 text-teal-600 border-teal-500/20",
                      };

                      const outcomeLabels: any = {
                        informed_fault: "Informed Fault Details",
                        no_response: "No Response",
                        declined_repair: "Customer Declined Fix",
                        custom: "Discussion Update",
                      };

                      return (
                        <div key={log.id} className="p-3 bg-card border border-border/50 rounded-2xl space-y-1.5 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${outcomeColors[log.outcome] || "bg-muted text-muted-foreground"}`}>
                              {outcomeLabels[log.outcome] || log.outcome}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(log.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-foreground font-medium leading-relaxed italic">
                              "{log.notes}"
                            </p>
                          )}
                          <div className="text-[8px] font-bold text-muted-foreground uppercase text-right tracking-widest pt-0.5">
                            Logged by: {log.createdBy?.fullName || "System"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Log Call Modal */}
      <Modal
        isOpen={isCallLogModalOpen}
        onClose={() => setIsCallLogModalOpen(false)}
        title={`Log Call for Ticket #${selectedRepairForCall?.jobNumber}`}
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setIsCallLogModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={handleLogCallSubmit} 
              disabled={isLoggingCall}
            >
              {isLoggingCall ? "Logging..." : "Log Communication"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Call Outcome</label>
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-border/60 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="informed_fault">Spoke to Customer (Informed Fault & Cost)</option>
              <option value="no_response">No Response (Unreachable / Call Not Answered)</option>
              <option value="declined_repair">Customer Declined Repair (Do Not Proceed)</option>
              <option value="custom">Custom Discussion / Update</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notes & Details</label>
            <textarea
              className="w-full rounded-2xl border border-border/60 bg-background p-4 text-xs font-medium focus:ring-primary/20 transition-all min-h-[80px]"
              placeholder={
                callOutcome === "no_response" 
                  ? "Optional details (e.g. called twice, busy tone)..."
                  : "Write details of what the customer said or details informed..."
              }
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
