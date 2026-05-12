import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { 
  Wrench, CheckCircle, DollarSign, AlertCircle, 
  PlusCircle, UserPlus, FileText, CreditCard, ArrowUpRight,
  TrendingUp, Activity, Users, Box, Zap, Search, Bell, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === "ADMIN";
  
  const [summary, setSummary] = useState<any>(null);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);
  const [technicianWorkload, setTechnicianWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const [sumRes, repRes, techRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentRepairs(),
          dashboardService.getTechnicianWorkload()
        ]);
        setSummary(sumRes);
        setRecentRepairs(repRes);
        setTechnicianWorkload(techRes);
      } catch (error) {
        console.error("Dashboard synchronization failure", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[90vh] items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Terminal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Top Navigation & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
            <Zap className="h-3 w-3 fill-primary" /> System Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground">
            Welcome back, <span className="text-primary">{user?.fullName.split(' ')[0]}</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Monitor shop health and manage active repair pipelines.
          </p>
        </div>

      </div>

      {/* Primary Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Repairs", value: summary?.totalRepairs, detail: "Total lifetime", icon: Wrench, trend: "+5.2%", color: "blue" },
          { label: "Pending Queue", value: summary?.pendingRepairs, detail: "Needs attention", icon: Activity, trend: "-2.1%", color: "amber" },
          { label: "Throughput", value: summary?.completedToday, detail: "Completed today", icon: CheckCircle, trend: "+12.4%", color: "emerald" },
          ...(isAdmin ? [{ label: "Monthly Gross", value: `₹${Number(summary?.monthlyRevenue || 0).toLocaleString('en-IN')}`, detail: "Current period", icon: DollarSign, trend: "+8.1%", color: "indigo" }] : [{ label: "Staff Efficiency", value: "92%", detail: "Target: 90%+", icon: TrendingUp, trend: "+1.2%", color: "indigo" }])
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl border group-hover:scale-110 transition-transform", `bg-${stat.color}-500/10 border-${stat.color}-500/20 text-${stat.color}-500`)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", stat.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <div className="text-2xl font-black text-foreground">{stat.value || 0}</div>
              <p className="text-[10px] font-medium text-muted-foreground">{stat.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Worklist */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Active Repair Stream</h2>
                  <p className="text-[11px] font-medium text-muted-foreground">Real-time status of high-priority maintenance items.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => navigate('/repairs')}>
                View Registry <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-black uppercase text-[9px] tracking-widest">Job Code</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Client / Origin</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Asset Details</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[9px] tracking-widest">Status</TableHead>
                    <TableHead className="text-right px-6 py-4 font-black uppercase text-[9px] tracking-widest">Valuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRepairs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/30 transition-colors cursor-default group">
                      <TableCell className="px-6 py-4 font-black text-xs text-primary">{job.jobNumber}</TableCell>
                      <TableCell className="py-4">
                        <div className="text-[11px] font-bold text-foreground">{job.customer?.fullName}</div>
                        <div className="text-[9px] font-medium text-muted-foreground">{job.customer?.phoneNumber}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-[11px] font-black text-foreground">{job.brand}</div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase">{job.model}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <span className="text-[11px] font-black text-foreground tabular-nums">
                          ₹{Number(job.estimatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
             <h3 className="text-sm font-black tracking-tight flex items-center gap-2 uppercase">
               <Users className="h-4 w-4 text-primary" /> Workforce Utilization
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {technicianWorkload.slice(0, 3).map((tech) => (
                 <div key={tech.id} className="space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-foreground">{tech.fullName}</span>
                     <span className="text-[10px] font-bold text-muted-foreground">{tech._count.repairJobs} active</span>
                   </div>
                   <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary transition-all duration-500" 
                       style={{ width: `${Math.min(tech._count.repairJobs * 20, 100)}%` }} 
                     />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Side Actions & Monitors */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" /> Quick Access
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Inventory Registry", sub: "Stock & Management", icon: Box, path: "/products", color: "blue", adminOnly: false },
                { label: "Client Records", sub: "CRM & History", icon: Users, path: "/customers", color: "indigo", adminOnly: true },
                { label: "Financial Registry", sub: "Invoices & Billing", icon: CreditCard, path: "/invoices", color: "emerald", adminOnly: true },
                { label: "Job Archives", sub: "Historical Records", icon: FileText, path: "/repairs", color: "slate", adminOnly: false }
              ].filter(item => !item.adminOnly || isAdmin).map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-background hover:bg-muted/30 transition-all text-left group"
                >
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border", `bg-${action.color}-500/10 border-${action.color}-500/10 text-${action.color}-500`)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground uppercase tracking-wider">{action.label}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">{action.sub}</p>
                  </div>
                  <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Shop Vitals
            </h3>
            <div className="space-y-4">
              {[
                { label: "Live Clients", value: summary?.totalCustomers, status: "Healthy" },
                { label: "Catalog Assets", value: summary?.totalProducts, status: "Active" },
                { label: "Critical Stock", value: summary?.lowStockCount, status: summary?.lowStockCount > 0 ? "Alert" : "Normal", warn: summary?.lowStockCount > 0 }
              ].map((vital, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-border/40">
                  <div>
                    <p className="text-[11px] font-black text-foreground">{vital.label}</p>
                    <p className={cn("text-[9px] font-bold uppercase", vital.warn ? "text-red-500" : "text-emerald-500")}>{vital.status}</p>
                  </div>
                  <div className="text-lg font-black text-foreground tabular-nums">{vital.value || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
