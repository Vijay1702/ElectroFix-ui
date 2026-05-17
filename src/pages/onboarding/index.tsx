import { useState, useEffect } from "react";
import { userService } from "@/services/user.service";
import { 
  UserPlus, Mail, Phone, 
  Shield, Trash2, Edit, User, Lock, 
  AlertCircle, Users, Search
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Drawer } from "@/components/shared/Drawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "TECHNICIAN",
    perDaySalary: "0"
  });

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers(page, limit, search);
      setUsers((res.data || []).filter((u: any) => u.isActive !== false));
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full legal name is required";
    else if (formData.fullName.trim().length < 3) newErrors.fullName = "Full legal name must be at least 3 characters";

    if (!formData.email.trim()) newErrors.email = "Digital ID (Email) is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Contact phone is required";
    else if (formData.phoneNumber.trim().length !== 10) newErrors.phoneNumber = "Phone number must be exactly 10 characters";
    
    if (!editingUserId) {
      if (!formData.password.trim()) newErrors.password = "Access password is required";
      else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    } else {
      if (formData.password.trim() && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (formData.perDaySalary !== "") {
      const salary = Number(formData.perDaySalary);
      if (isNaN(salary) || salary < 0) {
        newErrors.perDaySalary = "Per day salary must be a non-negative number";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 5) score += 25;
    if (pass.length > 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return Math.min(100, score);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        perDaySalary: Number(formData.perDaySalary) || 0
      };

      if (editingUserId) {
        if (formData.password.trim()) {
          payload.password = formData.password;
        }
        await userService.updateUser(editingUserId, payload);
        toast.success("Personnel profile updated successfully");
      } else {
        payload.password = formData.password;
        await userService.createUser(payload);
        toast.success("Employee successfully integrated into the system");
      }
      setIsDrawerOpen(false);
      fetchUsers();
      setFormData({ fullName: "", email: "", phoneNumber: "", password: "", role: "TECHNICIAN", perDaySalary: "0" });
      setEditingUserId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failure. Please check network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (u: any) => {
    setErrors({});
    setEditingUserId(u.id);
    setFormData({
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      password: "",
      role: u.role?.name || u.role || "TECHNICIAN",
      perDaySalary: String(u.perDaySalary || 0)
    });
    setIsDrawerOpen(true);
  };

  const [userToDelete, setUserToDelete] = useState<any>(null);

  const handleDeleteClick = (u: any) => {
    setUserToDelete(u);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      toast.success("Personnel profile successfully deactivated");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to deactivate personnel profile");
    } finally {
      setUserToDelete(null);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Personnel Profile",
      headerClassName: "px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground",
      cellClassName: "px-6 py-5",
      render: (u) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-transform">
            {u.fullName.charAt(0)}
          </div>
          <div>
            <span className="font-black text-foreground text-sm tracking-tight">{u.fullName}</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Employee ID: {u.id.slice(0, 8)}</p>
          </div>
        </div>
      )
    },
    {
      header: "Digital Coordinates",
      render: (u) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-foreground font-bold">
            <Mail className="h-3.5 w-3.5 text-primary/60" /> {u.email}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black tracking-wider uppercase">
            <Phone className="h-3.5 w-3.5 text-primary/60" /> {u.phoneNumber}
          </div>
        </div>
      )
    },
    {
      header: "Access Clearance",
      render: (u) => (
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.15em]",
          (u.role?.name || u.role) === 'ADMIN' 
            ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" 
            : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
        )}>
          <Shield className="h-3.5 w-3.5" />
          {u.role?.name || u.role}
        </div>
      )
    },
    {
      header: "Operational Status",
      render: (u) => (
        <div className="flex items-center gap-2">
          {u.operationalStatus !== "Inactive" ? (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Duty</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-slate-400 shadow-lg shadow-slate-400/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactive</span>
            </>
          )}
        </div>
      )
    },
    {
      header: "Daily Salary",
      render: (u) => (
        <span className="text-xs font-bold text-foreground">
          ₹{Number(u.perDaySalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: "Actions",
      headerClassName: "text-right px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground",
      cellClassName: "text-right px-6 py-5",
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5 ">
          <Button 
            onClick={() => handleEditClick(u)} 
            disabled={u.operationalStatus === "Inactive"} 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all disabled:opacity-30"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => handleDeleteClick(u)} 
            disabled={u.operationalStatus === "Inactive"} 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">Deactivate Personnel</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1">This action requires authorization.</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-8 leading-relaxed">
              Are you sure you want to deactivate the personnel profile for <span className="font-black text-foreground">{userToDelete.fullName}</span>? Their status will be marked as <span className="font-bold text-destructive">Inactive</span> and they will be excluded from active attendance rosters, but records will be preserved for payroll reports.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setUserToDelete(null)} className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest">
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-destructive/20">
                Deactivate Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader 
        title="Workforce Management" 
        description="Strategically expand your technical team and manage administrative system access."
        action={
          <Button variant="primary" onClick={() => { 
            setErrors({}); 
            setEditingUserId(null);
            setFormData({ fullName: "", email: "", phoneNumber: "", password: "", role: "TECHNICIAN", perDaySalary: "0" });
            setIsDrawerOpen(true); 
          }} className="rounded-xl shadow-xl shadow-primary/20 h-12 px-6">
            <UserPlus className="h-5 w-5" /> Onboard Personnel
          </Button>
        }
      />

      <DataTable 
        data={users} 
        columns={columns} 
        loading={loading} 
        loadingMessage="Retrieving Workforce Registry..."
        emptyMessage="No personnel records currently archived."
        toolbar={
          <div className="px-6 py-4 border-b border-border/50 flex flex-wrap gap-4 items-center justify-between bg-muted/20">
            <div className="w-72 relative group">
              <Input
                type="text"
                placeholder="Search personnel..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                className="rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all"
              />
            </div>
          </div>
        }
        pagination={
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total / limit)} 
            limit={limit} 
            onPageChange={setPage} 
            onLimitChange={(l) => { setLimit(l); setPage(1); }} 
          />
        }
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingUserId ? "Edit Personnel Profile" : "Personnel Onboarding Terminal"}
        size="md"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 h-12">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-xl shadow-primary/20">
              {isSubmitting ? "Processing Integration..." : (editingUserId ? "Save Changes" : "Finalize Onboarding")}
            </Button>
          </div>
        }
      >
        <div className="space-y-10">
          <div className="relative overflow-hidden bg-primary/5 rounded-[2rem] p-8 border border-primary/10 group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <UserPlus className="h-24 w-24" />
             </div>
             <div className="relative z-10 flex items-center gap-6">
               <div className="h-16 w-16 rounded-[1.25rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30">
                 <Shield className="h-8 w-8" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-1">Authorization Protocol</p>
                 <p className="text-lg font-black text-foreground tracking-tight">
                   {editingUserId ? "Edit Credentials" : "Define Personnel Credentials"}
                 </p>
                 <p className="text-xs font-bold text-muted-foreground mt-1">
                   {editingUserId ? "Modify access settings for active staff." : "Establishing system access for new technical staff."}
                 </p>
               </div>
             </div>
          </div>

          <div className="space-y-8 px-2">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Input 
                  label="Full Legal Name" 
                  required
                  placeholder="e.g. Vijay Raghavan"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({...formData, fullName: e.target.value});
                    if (errors.fullName) setErrors({...errors, fullName: ""});
                  }}
                  error={errors.fullName}
                  icon={<User className="h-4 w-4" />}
                  className="h-12 bg-muted/20 border-border/40 focus:bg-background"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Digital ID (Email)" 
                  required
                  type="email"
                  placeholder="v.raghavan@electrofix.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors({...errors, email: ""});
                  }}
                  error={errors.email}
                  icon={<Mail className="h-4 w-4" />}
                  className="h-12 bg-muted/20 border-border/40 focus:bg-background"
                />
                <Input 
                  label="Contact Frequency (Phone)" 
                  required
                  placeholder="+91 98400 12345"
                  type="number"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    setFormData({...formData, phoneNumber: e.target.value});
                    if (errors.phoneNumber) setErrors({...errors, phoneNumber: ""});
                  }}
                  error={errors.phoneNumber}
                  icon={<Phone className="h-4 w-4" />}
                  className="h-12 bg-muted/20 border-border/40 focus:bg-background"
                />
              </div>

              <div className="space-y-3">
                <Input 
                  label={editingUserId ? "Terminal Access Password (Leave blank to keep unchanged)" : "Terminal Access Password"} 
                  required={!editingUserId}
                  type="password"
                  placeholder={editingUserId ? "•••••••• (unchanged)" : "••••••••"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if (errors.password) setErrors({...errors, password: ""});
                  }}
                  error={errors.password}
                  icon={<Lock className="h-4 w-4" />}
                  className="h-12 bg-muted/20 border-border/40 focus:bg-background"
                />
                {formData.password && (
                  <div className="space-y-1 mt-2">
                    <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          getPasswordStrength(formData.password) <= 25 ? "bg-red-500" : 
                          getPasswordStrength(formData.password) <= 50 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${getPasswordStrength(formData.password)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right font-bold uppercase tracking-wider">
                      {getPasswordStrength(formData.password) <= 25 ? "Weak" : 
                       getPasswordStrength(formData.password) <= 50 ? "Fair" : 
                       getPasswordStrength(formData.password) <= 75 ? "Good" : "Strong"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Input 
                  label="Daily Salary Rate (₹)" 
                  type="number"
                  placeholder="e.g. 750"
                  value={formData.perDaySalary}
                  onChange={(e) => {
                    setFormData({...formData, perDaySalary: e.target.value});
                    if (errors.perDaySalary) setErrors({...errors, perDaySalary: ""});
                  }}
                  error={errors.perDaySalary}
                  icon={<span className="text-xs font-bold text-muted-foreground">₹</span>}
                  className="h-12 bg-muted/20 border-border/40 focus:bg-background"
                />
              </div>

              <div className="space-y-3 p-6 rounded-[1.5rem] bg-muted/30 border border-border/40">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield className="h-3 w-3" /> System Access Hierarchy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "TECHNICIAN", label: "Technician", sub: "Maintenance Portal" },
                    { val: "ADMIN", label: "Administrator", sub: "Full Command" }
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setFormData({...formData, role: r.val})}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-2xl border text-left transition-all",
                        formData.role === r.val 
                          ? "bg-background border-primary ring-2 ring-primary/10" 
                          : "bg-background/50 border-border/40 hover:border-primary/30"
                      )}
                    >
                      <span className={cn("text-xs font-black uppercase tracking-wider", formData.role === r.val ? "text-primary" : "text-foreground")}>{r.label}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-0.5">{r.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 flex gap-4">
               <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
               <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed">
                 {editingUserId ? "Password is optional when modifying existing users. Other fields remain mandatory." : "All fields are mandatory. Credentials established here will grant immediate access to the production environment."}
               </p>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
