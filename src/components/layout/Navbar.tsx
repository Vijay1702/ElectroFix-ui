import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";

const Navbar = () => {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <Input
          type="search"
          placeholder="Search repairs, customers..."
          className="bg-background h-10 rounded-lg"
          icon={<Search className="h-4 w-4" />}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <div className="h-8 w-[1px] bg-border mx-2" />
        <Button variant="ghost" size="icon">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
