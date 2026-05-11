import { useEffect, useState } from "react";
import { repairService } from "@/services/repair.service";
import { Plus, Search, Filter, Calendar, Eye, FileEdit } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchRepairs();
  }, [page, search]);

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

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Repair Jobs" 
        description="Track and manage all device repair tasks."
        action={
          <Button variant="primary">
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
              <Filter className="h-4 w-4" /> Filter by Status
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
              <TableHead>Dates</TableHead>
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
                    <div className="font-semibold">{job.deviceType} {job.deviceBrand}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{job.problemDescription}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{job.customer?.fullName || 'Walk-in'}</div>
                    <div className="text-xs text-muted-foreground">{job.customer?.phoneNumber || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(job.receivedDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <FileEdit className="h-4 w-4" />
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
