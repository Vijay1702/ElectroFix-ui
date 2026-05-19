import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import logoImg from "@/assets/logo.png";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/85 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - responsive drawer on mobile, static on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex md:w-64 h-full
        ${isSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none md:pointer-events-auto'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden h-16 items-center justify-between border-b bg-card px-4 z-30 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <img 
              src={logoImg} 
              alt="Sri Senthil Logo" 
              className="h-8 w-auto object-contain rounded-md"
            />
            <div className="text-left">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                Sri Senthil
              </h2>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none block mt-0.5">
                Spares & Services
              </span>
            </div>
          </div>
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </header>

        <main className="flex-1 overflow-y-auto relative focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
