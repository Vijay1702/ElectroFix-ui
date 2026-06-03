import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Tag,
  Boxes,
  FileText, 
  UserPlus,
  LogOut,
  Calendar,
  X,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import logoImg from "@/assets/logo.png";
import { syncService } from "@/services/sync.service";
import { toast } from "sonner";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success("Internet reconnected. Syncing offline changes...");
      setSyncing(true);
      const res = await syncService.sync();
      setSyncing(false);
      await updatePendingCount();
      if (res.success && res.syncedCount > 0) {
        toast.success(`Successfully synced ${res.syncedCount} changes to the cloud!`);
      } else if (res.error) {
        toast.error(`Sync error: ${res.error}`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Internet disconnected. Running in offline mode.");
    };

    // Check count periodically (every 5 seconds) to catch new offline entries
    const interval = setInterval(updatePendingCount, 5000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    toast.info("Syncing changes...");
    const res = await syncService.sync();
    setSyncing(false);
    const count = await syncService.getPendingCount();
    setPendingCount(count);
    if (res.success) {
      if (res.syncedCount > 0) {
        toast.success(`Successfully synced ${res.syncedCount} changes!`);
      } else {
        toast.info("All data is up to date.");
      }
    } else {
      toast.error(`Failed to sync: ${res.error}`);
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Onboarding", icon: UserPlus, path: "/onboarding", roles: ["ADMIN"] },
    { label: "Attendance", icon: Calendar, path: "/attendance", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Customers", icon: Users, path: "/customers", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Repair Jobs", icon: Wrench, path: "/repairs", roles: ["ADMIN", "TECHNICIAN"] },
    { label: "Products", icon: Tag, path: "/products", roles: ["ADMIN"] },
    { label: "Inventory", icon: Boxes, path: "/inventory", roles: ["ADMIN", "TECHNICIAN"] },
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
      <div className="p-4 flex flex-col items-center justify-center border-b gap-3 bg-primary/5 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <img 
          src={logoImg} 
          alt="Sri Senthil Spares & Services Logo" 
          className="h-16 w-auto object-contain rounded-xl shadow-md border border-primary/10"
        />
        <div className="text-center">
          <h1 className="text-xs font-black text-primary uppercase tracking-widest leading-snug">
            Sri Senthil
          </h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 leading-none">
            Spares & Services
          </p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
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
        {/* Network & Sync Status Panel */}
        <div className="px-3 py-2.5 rounded-xl bg-accent/40 border border-border/40 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">Network Status:</span>
            {isOnline ? (
              <span className="flex items-center gap-1 font-bold text-green-500">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-amber-500 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
          
          {pendingCount > 0 && (
            <div className="flex flex-col gap-1.5 mt-0.5 border-t border-border/40 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-amber-500">{pendingCount} changes pending</span>
                {isOnline && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1 disabled:opacity-50 transition-opacity cursor-pointer font-bold text-[10px]"
                  >
                    <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                    Sync
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

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
