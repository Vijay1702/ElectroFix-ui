import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Box, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Customers", icon: Users, path: "/customers" },
    { label: "Repair Jobs", icon: Wrench, path: "/repairs" },
    { label: "Products", icon: Box, path: "/products" },
    { label: "Invoices", icon: FileText, path: "/invoices" },
    { label: "Payments", icon: CreditCard, path: "/payments" },
    { label: "Reports", icon: BarChart3, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">ElectroFix</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">AD</span>
          </div>
          <div>
            <p className="text-xs font-medium">Admin User</p>
            <p className="text-[10px] text-muted-foreground">admin@electrofix.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
