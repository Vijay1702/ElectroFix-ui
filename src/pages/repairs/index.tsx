import { useEffect, useState } from "react";
import { repairService } from "@/services/repair.service";
import { Plus, Search, Filter, Calendar, Eye, FileEdit, Smartphone, User, Wrench, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { Label } from "@/components/shared/Label";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Drawer } from "@/components/shared/Drawer";

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);

  useEffect(() => {
    fetchRepairs();
  }, [page, search, limit]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const res = await repairService.getRepairs(page, limit, search);
      setRepairs(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch repairs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (repair: any = null) => {
    setSelectedRepair(repair);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Repair Jobs" 
        description="Track and manage all device repair tasks."
        action={
          <Button variant="primary" onClick={() => handleOpenDrawer()}>
            <Plus className="h-5 w-5" /> New Repair Job
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
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
            <Button variant="outline" className="hidden sm:flex">
              <Filter className="h-4 w-4" /> All Statuses
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job No.</TableHead>
              <TableHead>Device & Issue</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
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
            ) : repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No repair jobs found.
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-bold text-primary">{job.jobNumber}</TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground">{job.deviceType} {job.brand}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight truncate max-w-[150px]">{job.problemDescription}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{job.customer?.fullName || 'Walk-in'}</div>
                    <div className="text-[10px] text-muted-foreground">{job.customer?.phoneNumber || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(job.receivedDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDrawer(job)} className="text-primary hover:bg-primary/5">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
                        <FileEdit className="h-4 w-4" />
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

      {/* Repair Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedRepair ? "Repair Details" : "New Repair Entry"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary">{selectedRepair ? "Save Changes" : "Create Job Ticket"}</Button>
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

           <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Customer Information</label>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">Client Name</p>
                             <p className="text-sm font-semibold">{selectedRepair?.customer?.fullName || "Select Customer..."}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">Expected Delivery</p>
                             <p className="text-sm font-semibold">{selectedRepair?.expectedDeliveryDate ? new Date(selectedRepair.expectedDeliveryDate).toLocaleDateString() : "Not Set"}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Technician Assigned</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                       <Wrench className="h-4 w-4 text-primary" />
                       <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">Assigned To</p>
                          <p className="text-sm font-semibold">{selectedRepair?.technician?.fullName || "Unassigned"}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Device Details</label>
                     <div className="grid gap-4">
                        <Input label="Device Type" required placeholder="e.g. Smartphone" defaultValue={selectedRepair?.deviceType} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Brand" placeholder="e.g. Samsung" defaultValue={selectedRepair?.brand} />
                          <Input label="Model" placeholder="e.g. Galaxy S21" defaultValue={selectedRepair?.model} />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <TextArea 
                       label="Problem Description"
                       required
                       placeholder="Describe the issue in detail..."
                       defaultValue={selectedRepair?.problemDescription}
                     />
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
