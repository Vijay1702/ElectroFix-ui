import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { 
  Wrench, CheckCircle, DollarSign, AlertCircle, 
  PlusCircle, UserPlus, FileText, CreditCard, ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [technicianWorkload, setTechnicianWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, repRes, invRes, techRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentRepairs(),
          dashboardService.getRecentSales(),
          dashboardService.getTechnicianWorkload()
        ]);
        setSummary(sumRes);
        setRecentRepairs(repRes);
        setRecentInvoices(invRes);
        setTechnicianWorkload(techRes);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back! Here's an overview of your shop's performance."
      />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-container border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Repairs</h3>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mt-2">{summary?.totalRepairs || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">Lifetime tickets recorded</p>
        </div>

        <div className="card-container border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Jobs</h3>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold mt-2">{summary?.pendingRepairs || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">Currently in progress</p>
        </div>

        <div className="card-container border-l-4 border-l-green-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed Today</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mt-2">{summary?.completedToday || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">Delivered in last 24 hours</p>
        </div>

        <div className="card-container border-l-4 border-l-primary">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Revenue</h3>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="text-3xl font-bold mt-2">
            ${Number(summary?.monthlyRevenue || 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Total sales this month</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Column: Tables */}
        <div className="md:col-span-8 flex flex-col gap-8">
          {/* Recent Repairs Table */}
          <div className="card-container p-0 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b bg-muted/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Repair Jobs</h2>
                <p className="text-sm text-muted-foreground">Latest ticket updates</p>
              </div>
              <Link to="/repairs">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRepairs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-bold text-primary">{job.jobNumber}</TableCell>
                    <TableCell className="font-medium">{job.customer?.fullName || 'Unknown'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{job.brand} {job.model}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">${Number(job.estimatedCost).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Recent Invoices Table */}
          <div className="card-container p-0 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b bg-muted/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent Billing</h2>
                <p className="text-sm text-muted-foreground">Latest invoices generated</p>
              </div>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{inv.customer?.fullName}</TableCell>
                    <TableCell>
                      <StatusBadge status={inv.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                      ${Number(inv.grandTotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="md:col-span-4 flex flex-col gap-8">
          {/* Quick Actions Widget */}
          <div className="card-container p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => navigate('/repairs')}
              >
                <PlusCircle className="h-5 w-5 text-primary" />
                <span className="text-xs">New Repair</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-dashed hover:border-blue-500 hover:bg-blue-50/50"
                onClick={() => navigate('/customers')}
              >
                <UserPlus className="h-5 w-5 text-blue-500" />
                <span className="text-xs">Add Customer</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-dashed hover:border-green-500 hover:bg-green-50/50"
                onClick={() => navigate('/invoices')}
              >
                <FileText className="h-5 w-5 text-green-500" />
                <span className="text-xs">New Invoice</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-dashed hover:border-purple-500 hover:bg-purple-50/50"
                onClick={() => navigate('/payments')}
              >
                <CreditCard className="h-5 w-5 text-purple-500" />
                <span className="text-xs">Record Payment</span>
              </Button>
            </div>
          </div>

          {/* Technician Workload Widget */}
          <div className="card-container p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Technician Workload</h2>
            <div className="space-y-4">
              {technicianWorkload.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {tech.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tech.fullName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Active Jobs</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold bg-muted px-2 py-1 rounded-md">
                    {tech._count.repairJobs}
                  </div>
                </div>
              ))}
              {technicianWorkload.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 italic">No active technicians</p>
              )}
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="card-container p-6 bg-muted/20 border-none">
             <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Inventory & Customers</h2>
             <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-border/50 pb-3">
                 <span className="text-sm font-medium">Total Customers</span>
                 <span className="font-bold">{summary?.totalCustomers || 0}</span>
               </div>
               <div className="flex items-center justify-between border-b border-border/50 pb-3">
                 <span className="text-sm font-medium">Products in Stock</span>
                 <span className="font-bold">{summary?.totalProducts || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Low Stock Alerts</span>
                 <span className="font-bold text-destructive">{summary?.lowStockCount || 0}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
