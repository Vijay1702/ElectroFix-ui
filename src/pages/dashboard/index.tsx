import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { MonitorDashboard } from "./MonitorDashboard";
import { notificationService } from "@/services/notification.service";
import { toast } from "sonner";
import { 
  Wrench, CheckCircle, DollarSign, 
  FileText, CreditCard, ArrowUpRight,
  TrendingUp, Activity, Users, Box, Zap, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
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
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setRefreshing(true);
        const [sumRes, repRes, techRes, lowStockRes] = await Promise.all([
          dashboardService.getSummary(startDate, endDate),
          dashboardService.getRecentRepairs(5, startDate, endDate),
          dashboardService.getTechnicianWorkload(startDate, endDate),
          dashboardService.getLowStock(5)
        ]);
        setSummary(sumRes);
        setRecentRepairs(repRes);
        setTechnicianWorkload(techRes);
        setLowStockItems(lowStockRes || []);
      } catch (error) {
        console.error("Dashboard synchronization failure", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboard();
  }, [user, startDate, endDate]);

  useEffect(() => {
    const handleNotifications = async () => {
      if (!user) return;
      try {
        const res = await notificationService.getUnreadNotifications();
        const unread = res.data.notifications || [];
        
        unread.forEach((note: any) => {
          toast.success(note.title, {
            description: note.message,
            duration: 8000,
          });
          notificationService.markAsRead(note.id);
        });
      } catch (error) {
        console.error("Notification sync failed", error);
      }
    };
    handleNotifications();
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Terminal</p>
        </div>
      </div>
    );
  }

  if (userRole === "MONITOR") {
    return <MonitorDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] dark:from-[#020617] dark:to-[#0f172a] p-4 lg:p-6 lg:px-6 space-y-6 animate-in fade-in duration-700">
      {/* Top Navigation & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
            <Zap className="h-3 w-3 fill-primary animate-pulse" /> System Dashboard
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">{user?.fullName.split(' ')[0]}</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-xl">
            Here's a deep dive into your shop's health and active repair pipelines.
          </p>
        </div>

        {/* Period Filter Dropdown */}
        {(isAdmin || userRole === "MONITOR") && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <DateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              disabled={refreshing}
            />
          </div>
        )}
      </div>

      {/* Primary Metrics Strip */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300", refreshing && "opacity-50")}>
        {[
          { label: "Active Repairs", value: summary?.activeRepairs, detail: "Active & not started", icon: Wrench, classes: { glow: "bg-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", badgeText: "text-blue-600 dark:text-blue-400" } },
          { label: "Pending to Deliver", value: summary?.pendingToDeliverRepairs, detail: "Awaiting delivery", icon: Activity, classes: { glow: "bg-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", badgeText: "text-amber-600 dark:text-amber-400" } },
          { label: "Throughput", value: summary?.completedToday, detail: "Completed today", icon: CheckCircle, classes: { glow: "bg-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", badgeText: "text-emerald-600 dark:text-emerald-400" } },
          ...((isAdmin || userRole === "MONITOR") ? [{ label: `Net Revenue`, value: `₹${Number(summary?.periodRevenue || 0).toLocaleString('en-IN')}`, detail: `Gross: ₹${Number(summary?.periodGross || 0).toLocaleString('en-IN')}`, icon: DollarSign, classes: { glow: "bg-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500", badgeText: "text-indigo-600 dark:text-indigo-400" } }] : [{ label: "Staff Efficiency", value: "92%", detail: "Target: 90%+", icon: TrendingUp, classes: { glow: "bg-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500", badgeText: "text-indigo-600 dark:text-indigo-400" } }])
        ].map((stat, i) => (
          <div key={i} className="relative group overflow-hidden rounded-2xl">
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 lg:p-5 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-1 h-full">
              {/* Glowing corner orb */}
              <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40", stat.classes.glow)}></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">{stat.label}</p>
                  <div className="text-4xl font-black text-foreground tracking-tighter">{stat.value || 0}</div>
                  <div className={cn("inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md border", stat.classes.bg, stat.classes.border, stat.classes.badgeText)}>
                    {stat.detail}
                  </div>
                </div>
                <div className={cn("p-4 rounded-2xl border backdrop-blur-sm transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm bg-background", stat.classes.border, stat.classes.text)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Active Repair Stream (Full Width) */}
      <div className={cn("transition-opacity duration-300", refreshing && "opacity-50")}>
         <div className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
           <div className="p-4 lg:p-5 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-background to-transparent">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                 <Activity className="h-5 w-5" />
               </div>
               <div>
                 <h2 className="text-xl font-black tracking-tight">Active Repair Stream</h2>
                 <p className="text-xs font-semibold text-muted-foreground">Real-time status of high-priority maintenance items.</p>
               </div>
             </div>
             <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-widest gap-2 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => navigate('/repairs')}>
               View Registry <ArrowUpRight className="h-3 w-3" />
             </Button>
           </div>
           <div className="overflow-x-auto p-2">
             <Table>
               <TableHeader>
                 <TableRow className="hover:bg-transparent border-border/40">
                   <TableHead className="text-xs uppercase tracking-wider font-bold">Job Code</TableHead>
                   <TableHead className="text-xs uppercase tracking-wider font-bold">Client / Origin</TableHead>
                   <TableHead className="text-xs uppercase tracking-wider font-bold">Asset Details</TableHead>
                   <TableHead className="text-xs uppercase tracking-wider font-bold">Status</TableHead>
                   <TableHead className="text-right text-xs uppercase tracking-wider font-bold">Valuation</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {recentRepairs.map((job) => (
                   <TableRow key={job.id} className="cursor-default hover:bg-muted/30 transition-colors border-border/20">
                     <TableCell className="font-bold text-primary">{job.jobNumber}</TableCell>
                     <TableCell>
                       <div className="text-sm font-bold text-foreground">{job.customer?.fullName}</div>
                       <div className="text-xs font-medium text-muted-foreground">{job.customer?.phoneNumber}</div>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm font-bold text-foreground">{job.brand}</div>
                       <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{job.model}</div>
                     </TableCell>
                     <TableCell>
                       <StatusBadge status={job.status} />
                     </TableCell>
                     <TableCell className="text-right">
                       <span className="text-sm font-bold text-foreground tabular-nums">
                         ₹{Number(job.estimatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                       </span>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
         </div>
      </div>

      {/* 4 & 5. 2-Column Split Grids */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-300", refreshing && "opacity-50")}>
        
        {/* ROW 4 LEFT: Shop Vitals */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-4 lg:p-5 shadow-xl space-y-6 flex flex-col justify-between">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Shop Vitals
          </h3>
          <div className="space-y-5">
            {[
              { label: "Live Clients", value: summary?.totalCustomers, status: "Healthy" },
              { label: "Catalog Assets", value: summary?.totalProducts, status: "Active" },
              { label: "Critical Stock", value: summary?.lowStockCount, status: summary?.lowStockCount > 0 ? "Alert" : "Optimal", warn: summary?.lowStockCount > 0 }
            ].map((vital, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 group hover:bg-muted/10 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground">{vital.label}</p>
                  <p className={cn("text-[10px] font-black uppercase tracking-wider", vital.warn ? "text-red-500" : "text-emerald-500")}>{vital.status}</p>
                </div>
                <div className="text-xl font-black text-foreground tabular-nums group-hover:text-primary transition-colors">{vital.value || 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 4 RIGHT: Quick Actions */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-4 lg:p-5 shadow-xl space-y-6">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2 text-muted-foreground">
            <Box className="h-4 w-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Inventory Registry", sub: "Stock Management", icon: Box, path: "/inventory", classes: { gradient: "from-blue-500 to-transparent", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500" }, adminOnly: false },
              { label: "Client Records", sub: "CRM & History", icon: Users, path: "/customers", classes: { gradient: "from-indigo-500 to-transparent", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500" }, adminOnly: true },
              { label: "Financial Registry", sub: "Invoices & Billing", icon: CreditCard, path: "/invoices", classes: { gradient: "from-emerald-500 to-transparent", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" }, adminOnly: true },
              { label: "Job Archives", sub: "Historical Records", icon: FileText, path: "/repairs", classes: { gradient: "from-slate-500 to-transparent", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-500" }, adminOnly: false }
            ].filter(item => !item.adminOnly || isAdmin || userRole === "MONITOR").map((action, i) => (
              <button 
                key={i} 
                onClick={() => navigate(action.path)}
                className="relative flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/50 hover:bg-card overflow-hidden transition-all text-left group hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r", action.classes.gradient)}></div>
                <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", action.classes.bg, action.classes.border, action.classes.text)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="z-10 truncate">
                  <p className="text-xs font-black text-foreground uppercase tracking-widest truncate">{action.label}</p>
                  <p className="text-[10px] font-bold text-muted-foreground truncate">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ROW 5 LEFT: Workforce Utilization */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-4 lg:p-5 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-widest flex items-center gap-2 uppercase text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> Workforce Utilization
            </h3>
          </div>
          <div className="space-y-6">
            {technicianWorkload.map((tech) => (
              <div key={tech.id} className="space-y-3 group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{tech.fullName}</span>
                  <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{tech._count.repairJobs} active</span>
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(tech._count.repairJobs * 20, 100)}%` }} 
                  >
                     <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 5 RIGHT: Low Stock Details */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-4 lg:p-5 shadow-xl space-y-6">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2 text-muted-foreground">
            <Box className="h-4 w-4 text-red-500 animate-pulse" /> Low Stock Details
          </h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                <p className="text-xs font-bold text-muted-foreground">Inventory is optimal.</p>
              </div>
            ) : (
              lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{item.productCode || "No SKU"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                      {item.stockQuantity} / {item.minimumStock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

     

    </div>
  );
}
