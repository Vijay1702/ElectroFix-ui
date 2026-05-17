import { useState, useEffect } from "react";
import { userService } from "@/services/user.service";
import { 
  UserPlus, Mail, Phone, 
  Shield, Trash2, Edit, User, Lock, 
  AlertCircle, Users 
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/shared/Table";
import { Drawer } from "@/components/shared/Drawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "TECHNICIAN"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers(1, 100);
      setUsers((res.data || []).filter((u: any) => u.isActive !== false));
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

    if (!formData.email.trim()) newErrors.email = "Work email is required";
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
      if (editingUserId) {
        const payload: any = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role
        };
        if (formData.password.trim()) {
          payload.password = formData.password;
        }
        await userService.updateUser(editingUserId, payload);
        toast.success("Personnel profile updated successfully");
      } else {
        await userService.createUser(formData);
        toast.success("Employee successfully integrated into the system");
      }
      setIsDrawerOpen(false);
      fetchUsers();
      setFormData({ fullName: "", email: "", phoneNumber: "", password: "", role: "TECHNICIAN" });
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
      role: u.role?.name || u.role || "TECHNICIAN"
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
      toast.success("Personnel profile successfully removed");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove personnel profile");
    } finally {
      setUserToDelete(null);
    }
  };

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
                <h3 className="text-lg font-black tracking-tight text-foreground">Confirm Deletion</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1">This action requires authorization.</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-8 leading-relaxed">
              Are you sure you want to permanently delete the personnel profile for <span className="font-black text-foreground">{userToDelete.fullName}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setUserToDelete(null)} className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest">
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-destructive/20">
                Delete Profile
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
            setFormData({ fullName: "", email: "", phoneNumber: "", password: "", role: "TECHNICIAN" });
            setIsDrawerOpen(true); 
          }} className="rounded-xl shadow-xl shadow-primary/20 h-12 px-6">
            <UserPlus className="h-5 w-5" /> Onboard Personnel
          </Button>
        }
      />

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px] border-border/60 shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Personnel Profile</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Digital Coordinates</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Access Clearance</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Operational Status</TableHead>
              <TableHead className="text-right px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="h-10 w-10 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Retrieving Workforce Registry...</p>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <Users className="h-12 w-12" />
                    <p className="text-sm font-bold">No personnel records currently archived.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="group hover:bg-primary/[0.03] transition-all cursor-default border-b border-border/40">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-transform">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-black text-foreground text-sm tracking-tight">{u.fullName}</span>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Employee ID: {u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-foreground font-bold">
                        <Mail className="h-3.5 w-3.5 text-primary/60" /> {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black tracking-wider uppercase">
                        <Phone className="h-3.5 w-3.5 text-primary/60" /> {u.phoneNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.15em]",
                      (u.role?.name || u.role) === 'ADMIN' 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" 
                        : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                    )}>
                      <Shield className="h-3.5 w-3.5" />
                      {u.role?.name || u.role}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Duty</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6 py-5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button onClick={() => handleEditClick(u)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDeleteClick(u)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
