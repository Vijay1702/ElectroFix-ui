import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceService } from "@/services/attendance.service";
import { userService } from "@/services/user.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function AttendancePage() {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = userRole === 'ADMIN';

  // State
  const [activeTab, setActiveTab] = useState<"attendance" | "payroll">(isAdmin ? "attendance" : "payroll");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Admin states
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "Present" | "Absent">>({});
  const [payrollData, setPayrollData] = useState<any>(null);

  // Employee states
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [mySalaryRate, setMySalaryRate] = useState<number>(0);

  // Fetch all active technicians for daily checklist
  const fetchActiveTechnicians = async () => {
    try {
      const res = await userService.getUsers(1, 100, "", "TECHNICIAN");
      // Filter out Inactive personnel for daily mark sheets
      const activeTechs = (res.data || []).filter(
        (u: any) => u.operationalStatus !== "Inactive"
      );
      setEmployees(activeTechs);

      // Reset record states
      const initialRecords: Record<string, "Present" | "Absent"> = {};
      activeTechs.forEach((emp: any) => {
        initialRecords[emp.id] = "Present"; // default present
      });
      setAttendanceRecords(initialRecords);
    } catch (error) {
      console.error("Failed to retrieve employee roster", error);
      toast.error("Roster query failed");
    }
  };

  // Fetch logged attendance for the selected date
  const fetchDailyAttendance = async (targetDate: string) => {
    setLoading(true);
    try {
      const logs = await attendanceService.getAttendance({ date: targetDate });
      
      // Update toggle states with existing entries if found
      setAttendanceRecords(prev => {
        const updated = { ...prev };
        logs.forEach((log: any) => {
          updated[log.employeeId] = log.status as "Present" | "Absent";
        });
        return updated;
      });
    } catch (error) {
      console.error("Failed to fetch daily logs", error);
    } finally {
      setLoading(false);
    }
  };

  // Save bulk logs
  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      const payload = Object.entries(attendanceRecords).map(([employeeId, status]) => ({
        employeeId,
        status,
      }));
      await attendanceService.saveAttendanceBulk(date, payload);
      toast.success(`Attendance successfully logged for ${date}`);
      fetchDailyAttendance(date);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to log attendance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch payroll records
  const fetchPayroll = async (m: number, y: number) => {
    setLoading(true);
    try {
      const data = await attendanceService.getPayroll(m, y);
      setPayrollData(data);
    } catch (error) {
      console.error("Payroll calculation failed", error);
      toast.error("Payroll calculation failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch technician calendar
  const fetchMyAttendance = async (m: number, y: number) => {
    setLoading(true);
    try {
      const data = await attendanceService.getAttendance({ month: m, year: y });
      setMyAttendance(data);

      // Get profile to check daily salary rate
      const myProfile = user;
      setMySalaryRate(Number((myProfile as any)?.perDaySalary || 0));
    } catch (error) {
      console.error("Personal attendance load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchActiveTechnicians();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === "attendance" && date) {
      fetchDailyAttendance(date);
    }
  }, [isAdmin, activeTab, date]);

  useEffect(() => {
    if (isAdmin && activeTab === "payroll") {
      fetchPayroll(month, year);
    }
  }, [isAdmin, activeTab, month, year]);

  useEffect(() => {
    if (!isAdmin) {
      fetchMyAttendance(month, year);
    }
  }, [isAdmin, month, year]);

  // Calendar utilities for Technician View
  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m, 0).getDate();
  };

  const getCalendarDays = () => {
    const totalDays = getDaysInMonth(month, year);
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const targetDateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const log = myAttendance.find(
        (a) => a.attendanceDate.split("T")[0] === targetDateStr
      );
      days.push({
        day: d,
        dateString: targetDateStr,
        status: log ? log.status : "Unmarked",
      });
    }
    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    } else {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Admin Tables config
  const dailyColumns: Column<any>[] = [
    {
      header: "Employee Profile",
      cellClassName: "px-6 py-4",
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
            {emp.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm">{emp.fullName}</div>
            <div className="text-[10px] text-muted-foreground">{emp.email}</div>
          </div>
        </div>
      )
    },
    {
      header: "Daily Wage Rate",
      render: (emp) => (
        <span className="text-xs font-black">₹{Number(emp.perDaySalary || 0).toLocaleString('en-IN')}</span>
      )
    },
    {
      header: "Attendance Marking",
      headerClassName: "text-right px-6",
      cellClassName: "text-right px-6",
      render: (emp) => {
        const currentStatus = attendanceRecords[emp.id] || "Present";
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAttendanceRecords(prev => ({ ...prev, [emp.id]: "Present" }))}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all",
                currentStatus === "Present"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/10"
                  : "bg-background border-border/40 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-600"
              )}
            >
              Present
            </button>
            <button
              onClick={() => setAttendanceRecords(prev => ({ ...prev, [emp.id]: "Absent" }))}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border transition-all",
                currentStatus === "Absent"
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-bold ring-2 ring-red-500/10"
                  : "bg-background border-border/40 text-muted-foreground hover:border-red-500/30 hover:text-red-600"
              )}
            >
              Absent
            </button>
          </div>
        );
      }
    }
  ];

  const payrollColumns: Column<any>[] = [
    {
      header: "Personnel Profile",
      render: (p) => (
        <div>
          <div className="font-black text-sm">{p.fullName}</div>
          <div className="text-[10px] text-muted-foreground tracking-tighter uppercase">{p.role}</div>
        </div>
      )
    },
    {
      header: "Daily Salary Rate",
      render: (p) => <span className="text-xs font-bold">₹{Number(p.perDaySalary).toFixed(2)}</span>
    },
    {
      header: "Present Days",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
          <CheckCircle2 className="h-3.5 w-3.5" /> {p.presentDays}
        </div>
      )
    },
    {
      header: "Absent Days",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold">
          <XCircle className="h-3.5 w-3.5" /> {p.absentDays}
        </div>
      )
    },
    {
      header: "Total Calculated Salary",
      headerClassName: "text-right px-6",
      cellClassName: "text-right px-6",
      render: (p) => (
        <span className="text-sm font-black text-primary">
          ₹{Number(p.totalSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Attendance & Salaries" 
        description={
          isAdmin 
            ? "Mark employee daily presence and automate payroll and monthly wage calculations." 
            : "Review your personal monthly attendance logs and estimated salary calculations."
        }
      />

      {/* Tabs */}
      {isAdmin && (
        <div className="flex border-b border-border/40 gap-4 mb-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all px-2",
              activeTab === "attendance" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Daily Log Roster
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all px-2",
              activeTab === "payroll" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Payroll Calculator
          </button>
        </div>
      )}

      {/* 1. ADMIN ATTENDANCE MARKING TAB */}
      {isAdmin && activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card border border-border/40 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block">Date Selection</span>
                <span className="text-sm font-black tracking-tight">{date}</span>
              </div>
            </div>
            <div className="w-56">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-border/50 h-10 bg-background"
              />
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
            <DataTable
              data={employees}
              columns={dailyColumns}
              loading={loading}
              loadingMessage="Retrieving staff roster..."
              emptyMessage="No technicians are currently onboarded in system."
            />
            
            <div className="px-6 py-5 border-t border-border/40 flex justify-end bg-muted/20">
              <Button
                variant="primary"
                onClick={handleSaveAttendance}
                disabled={loading || employees.length === 0}
                className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-xl shadow-primary/20"
              >
                {loading ? "Saving Records..." : "Lock Attendance Sheet"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN PAYROLL CALCULATOR TAB */}
      {isAdmin && activeTab === "payroll" && (
        <div className="space-y-6">
          {/* Payroll filter bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-card border border-border/40 rounded-3xl p-6 shadow-sm">
            <div className="flex gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="h-10 px-4 rounded-xl border border-border/50 bg-background text-xs font-bold"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="h-10 px-4 rounded-xl border border-border/50 bg-background text-xs font-bold"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {payrollData && (
              <div className="flex gap-6">
                <div className="text-right">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Staff</span>
                  <p className="text-sm font-black text-foreground">{payrollData.employeesCount} Personnel</p>
                </div>
                <div className="text-right border-l border-border/40 pl-6">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Payroll Outflow</span>
                  <p className="text-sm font-black text-primary">₹{payrollData.totalPayrollCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
            <DataTable
              data={payrollData?.payroll || []}
              columns={payrollColumns}
              loading={loading}
              loadingMessage="Calculating payroll metrics..."
              emptyMessage="No historical payroll found for selected period."
            />
          </div>
        </div>
      )}

      {/* 3. EMPLOYEE PERSONAL ATTENDANCE VIEW */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Work Roster Calendar</h3>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">Logs for your designated shift schedule</p>
                </div>
                <div className="flex items-center gap-3 border border-border/40 rounded-2xl p-1 bg-muted/20">
                  <Button variant="ghost" size="icon" onClick={() => changeMonth("prev")} className="h-8 w-8 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs font-black uppercase tracking-wider">{monthNames[month - 1]} {year}</span>
                  <Button variant="ghost" size="icon" onClick={() => changeMonth("next")} className="h-8 w-8 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] border-b border-border/20 pb-4">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-3">
                {getCalendarDays().map((dayObj) => {
                  let statusColor = "bg-muted/10 border-border/30 text-muted-foreground";
                  if (dayObj.status === "Present") {
                    statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold";
                  } else if (dayObj.status === "Absent") {
                    statusColor = "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 font-bold";
                  }

                  return (
                    <div
                      key={dayObj.dateString}
                      className={cn(
                        "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 group transition-all hover:scale-105",
                        statusColor
                      )}
                    >
                      <span className="text-xs font-black">{dayObj.day}</span>
                      <span className="text-[7px] font-black uppercase tracking-tighter opacity-80">{dayObj.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Earnings / Calculations Info */}
          <div className="space-y-6">
            {/* Wages calculation box */}
            <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="h-28 w-28 text-primary" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-1">Wage Statistics</span>
                  <h4 className="text-2xl font-black tracking-tight">Earnings Estimation</h4>
                  <p className="text-xs font-bold text-muted-foreground mt-1">Calculated wage statement for active month</p>
                </div>

                <div className="h-px bg-border/40 w-full" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">Daily Wage Scale</span>
                    <span className="text-sm font-black text-foreground">₹{mySalaryRate.toLocaleString('en-IN')}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">Present Days Logged</span>
                    <span className="text-sm font-black text-emerald-600">{myAttendance.filter(a => a.status === "Present").length} Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">Absent Days Logged</span>
                    <span className="text-sm font-black text-red-500">{myAttendance.filter(a => a.status === "Absent").length} Days</span>
                  </div>
                </div>

                <div className="h-px bg-border/40 w-full" />

                <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Expected Monthly Wage</span>
                  <span className="text-2xl font-black text-primary">
                    ₹{(myAttendance.filter(a => a.status === "Present").length * mySalaryRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance indicator summary card */}
            <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
              {myAttendance.some(a => a.attendanceDate.split("T")[0] === new Date().toISOString().split("T")[0]) ? (
                myAttendance.find(a => a.attendanceDate.split("T")[0] === new Date().toISOString().split("T")[0])?.status === "Present" ? (
                  <>
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
                    <div>
                      <div className="text-xs font-black">Today's Duty Status</div>
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mt-0.5">Marked: Present</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center"><XCircle className="h-5 w-5" /></div>
                    <div>
                      <div className="text-xs font-black">Today's Duty Status</div>
                      <div className="text-[10px] font-black text-red-600 uppercase tracking-wider mt-0.5">Marked: Absent</div>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs font-black">Today's Duty Status</div>
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider mt-0.5">Awaiting Supervisor Log</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
