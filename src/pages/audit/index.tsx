import { useState, useEffect } from 'react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { auditService, type AuditLog } from '@/services/audit.service';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { toast } from 'sonner';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(1000);
  
  // Filters
  const [menuName, setMenuName] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs({
        page,
        limit,
        menuName: menuName || undefined,
        action: action || undefined,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, menuName, action, startDate, endDate]);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      render: (row: AuditLog) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
    {
      header: 'User',
      accessor: 'userId',
      render: (row: AuditLog) => (
        <div>
          <p className="font-medium text-foreground">{row.user?.fullName || 'System'}</p>
          {row.user?.email && <p className="text-xs text-muted-foreground">{row.user.email}</p>}
        </div>
      ),
    },
    {
      header: 'Menu',
      accessor: 'menuName',
      render: (row: AuditLog) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          {row.menuName}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row: AuditLog) => {
        let colorClass = 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        if (row.action === 'CREATE') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (row.action === 'UPDATE') colorClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        if (row.action === 'DELETE') colorClass = 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        if (row.action === 'LOGIN') colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
            {row.action}
          </span>
        );
      }
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row: AuditLog) => (
        <span className="text-sm">{row.description}</span>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchable={false}
          paginated={true}
          title="Audit Logs"
          emptyMessage="No audit logs found."
          toolbarExtra={
            <div className="flex items-center gap-1.5">
              <DateRangePicker
                startDate={startDate ? startDate.toISOString().split('T')[0] : ""}
                endDate={endDate ? endDate.toISOString().split('T')[0] : ""}
                onRangeChange={(start, end) => {
                  setStartDate(start ? new Date(start) : undefined);
                  setEndDate(end ? new Date(end) : undefined);
                  setPage(1);
                }}
              />
              <select
                className="h-9 px-2 rounded-xl border border-border/60 bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={menuName}
                onChange={(e) => {
                  setMenuName(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Menus</option>
                <option value="Repairs">Repairs</option>
                <option value="Inventory">Inventory</option>
                <option value="Sales">Sales (Invoices)</option>
                <option value="Customers">Customers</option>
                <option value="Users">Users</option>
                <option value="System">System</option>
              </select>

              <select
                className="h-9 px-2 rounded-xl border border-border/60 bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Mobile view can be added here if necessary, matching other pages */}
    </div>
  );
}
