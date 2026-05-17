import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Box, 
  FileText, 
  UserPlus,
  LogOut,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ConfirmDialog } from "../shared/ConfirmDialog";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Onboarding", icon: UserPlus, path: "/onboarding", roles: ["ADMIN"] },
    { label: "Attendance", icon: Calendar, path: "/attendance", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Customers", icon: Users, path: "/customers", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Repair Jobs", icon: Wrench, path: "/repairs", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Products", icon: Box, path: "/products", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Invoices", icon: FileText, path: "/invoices", roles: ["ADMIN", "TECHNICIAN"] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole || "")
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">ElectroFix</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              (location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/"))
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-sm font-bold text-primary">
              {user?.fullName?.charAt(0) || "U"}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">{user?.fullName || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{userRole || "Member"}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to log out? You will need to log in again to access your workstation."
        confirmText="Logout"
        variant="danger"
        icon="logout"
      />
    </aside>
  );
};

export default Sidebar;
