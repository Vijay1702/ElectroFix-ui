import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { Wrench, CheckCircle, Users, DollarSign, PackageOpen, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, repRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentRepairs()
        ]);
        setSummary(sumRes);
        setRecentRepairs(repRes);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Welcome back! Here's an overview of your shop.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Repairs */}
        <div className="card-container hover:shadow-md transition-shadow relative overflow-hidden group border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Total Repairs</h3>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold mt-2">{summary?.totalRepairs || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">All time records</p>
        </div>

        {/* Pending Repairs */}
        <div className="card-container hover:shadow-md transition-shadow relative overflow-hidden group border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Pending Jobs</h3>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold mt-2">{summary?.pendingRepairs || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
        </div>

        {/* Completed Repairs */}
        <div className="card-container hover:shadow-md transition-shadow relative overflow-hidden group border-l-4 border-l-green-500">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Completed Today</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold mt-2">{summary?.completedToday || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">Jobs delivered today</p>
        </div>

        {/* Revenue */}
        <div className="card-container hover:shadow-md transition-shadow relative overflow-hidden group border-l-4 border-l-primary">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Monthly Revenue</h3>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold mt-2">
            ${summary?.monthlyRevenue ? Number(summary.monthlyRevenue).toFixed(2) : '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Current month</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Repairs Table */}
        <div className="card-container lg:col-span-5 p-0 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Latest Repair Jobs</h2>
              <p className="text-sm text-muted-foreground">Recently updated tickets</p>
            </div>
            <Link to="/repairs" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Job No.</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Device</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentRepairs.map((job) => (
                  <tr key={job.id} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{job.jobNumber}</td>
                    <td className="px-6 py-4">{job.customer?.fullName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{job.brand} {job.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${job.status === 'COMPLETED' || job.status === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 
                          job.status === 'PENDING' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 
                          'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${Number(job.estimatedCost).toFixed(2)}</td>
                  </tr>
                ))}
                {recentRepairs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                      No recent repair jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="card-container lg:col-span-2 flex flex-col gap-6">
          <div>
             <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
             <div className="space-y-4">
               <div className="flex items-center justify-between border-b pb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                     <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                   </div>
                   <span className="font-medium">Total Customers</span>
                 </div>
                 <span className="font-bold">{summary?.totalCustomers || 0}</span>
               </div>
               <div className="flex items-center justify-between border-b pb-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                     <PackageOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                   </div>
                   <span className="font-medium">Products in Stock</span>
                 </div>
                 <span className="font-bold">{summary?.totalProducts || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                     <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                   </div>
                   <span className="font-medium">Low Stock Alerts</span>
                 </div>
                 <span className="font-bold text-orange-600">{summary?.lowStockCount || 0}</span>
               </div>
             </div>
          </div>

          <div className="mt-auto bg-primary/10 rounded-xl p-5 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">Check out the documentation or contact support for assistance.</p>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
