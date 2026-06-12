import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { 
  Activity, Wrench, Package, Users, Receipt,
  DollarSign, CheckCircle, ShieldCheck 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

export function MonitorDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [technicianWorkload, setTechnicianWorkload] = useState<any[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
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

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [sumRes, repRes, salesRes, lowStockRes, techRes, weeklyRes, topProdRes] = await Promise.all([
        dashboardService.getSummary(startDate, endDate),
        dashboardService.getRecentRepairs(4, startDate, endDate),
        dashboardService.getRecentSales(4, startDate, endDate),
        dashboardService.getLowStock(5),
        dashboardService.getTechnicianWorkload(startDate, endDate),
        dashboardService.getWeeklyPerformance(startDate, endDate),
        dashboardService.getTopProducts(5, startDate, endDate)
      ]);
      setSummary(sumRes);
      setRecentRepairs(repRes || []);
      setRecentSales(salesRes || []);
      setLowStockItems(lowStockRes || []);
      setTechnicianWorkload(techRes || []);
      setWeeklyPerformance(weeklyRes || []);
      setTopProducts(topProdRes || []);
    } catch (error) {
      console.error("Dashboard synchronization failure", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Loading Monitor View</p>
        </div>
      </div>
    );
  }

  const repairStatusData = [
    { name: 'Active & Not Started', value: summary?.activeRepairs || 0 },
    { name: 'Pending Delivery', value: summary?.pendingToDeliverRepairs || 0 },
    { name: 'Completed Today', value: summary?.completedToday || 0 },
  ];

  const totalActiveRepairs = technicianWorkload.reduce((sum, t) => sum + (t._count?.repairJobs || 0), 0) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] dark:from-[#020617] dark:to-[#0f172a] p-4 lg:p-6 lg:px-6 space-y-6 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
            <ShieldCheck className="h-3 w-3 fill-primary" /> Application Monitor
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            System Overview
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-xl">
            A specialized read-only view tracking core metrics and operations.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="relative group z-10">
            <DateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Feed Active</p>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: `₹${Number(summary?.periodGross || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Active Jobs", value: summary?.activeRepairs || 0, icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Items Low on Stock", value: summary?.lowStockCount || 0, icon: Package, color: summary?.lowStockCount > 0 ? "text-red-500" : "text-slate-500", bg: summary?.lowStockCount > 0 ? "bg-red-500/10" : "bg-slate-500/10" },
          { label: "Customers Served", value: summary?.totalCustomers || 0, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm h-[350px] flex flex-col">
          <h3 className="text-sm font-black tracking-widest uppercase mb-6 flex items-center gap-2">
             Operations Performance (Revenue)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPerformance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-muted-foreground" />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--card)' }}
                />
                <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repair Status Distribution Pie Chart */}
        <div className="lg:col-span-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm h-[350px] flex flex-col">
          <h3 className="text-sm font-black tracking-widest uppercase mb-2">Repair Pipeline</h3>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={repairStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {repairStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full space-y-2 mt-4">
              {repairStatusData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                    <span className="font-semibold text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-black text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row - Tech Workload & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Technician Workload */}
        <div className="lg:col-span-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-black tracking-widest uppercase flex items-center gap-2 text-indigo-500 mb-6 shrink-0">
            <Users className="h-4 w-4" /> Technician Workload
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {technicianWorkload.map((tech) => {
              const activeCount = tech._count?.repairJobs || 0;
              const percentage = Math.min(100, Math.max(5, (activeCount / totalActiveRepairs) * 100));
              
              return (
                <div key={tech.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-foreground">{tech.fullName}</span>
                    <span className="text-muted-foreground">{activeCount} Jobs</span>
                  </div>
                  <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {technicianWorkload.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No active technicians.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-black tracking-widest uppercase flex items-center gap-2 text-red-500 mb-6 shrink-0">
            <Package className="h-4 w-4" /> Stock Alerts
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                <p className="text-xs font-bold text-muted-foreground">Inventory levels are optimal.</p>
              </div>
            ) : (
              lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{item.productCode || "No SKU"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                      {item.stockQuantity} / {item.minimumStock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-black tracking-widest uppercase flex items-center gap-2 text-emerald-500 mb-6 shrink-0">
            <DollarSign className="h-4 w-4" /> Top Products (Revenue)
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs font-bold text-muted-foreground">No product sales in this period.</p>
              </div>
            ) : (
              topProducts.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{item.category || "General"}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold">{item.totalQuantity} sold</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Jobs Read-Only List */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-background to-transparent">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black tracking-tight">Recent Jobs</h2>
            </div>
          </div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-xs uppercase tracking-wider font-bold">Job No.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold">Device</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRepairs.map((job) => (
                  <TableRow key={job.id} className="cursor-default hover:bg-muted/30 transition-colors border-border/20">
                    <TableCell className="font-bold text-primary">{job.jobNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-foreground truncate max-w-[150px]">{job.deviceType}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[150px]">{job.brand}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={job.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Sales Read-Only List */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-background to-transparent">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-black tracking-tight">Recent Sales</h2>
            </div>
          </div>
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-xs uppercase tracking-wider font-bold">Inv No.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold">Client</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-default hover:bg-muted/30 transition-colors border-border/20">
                    <TableCell className="font-bold text-emerald-500">{sale.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-foreground truncate max-w-[150px]">{sale.customer?.fullName || 'Walk-in'}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground">₹{Number(sale.grandTotal).toLocaleString('en-IN')}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>

    </div>
  );
}
