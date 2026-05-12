import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().trim();
  
  const statusConfig: Record<string, { label: string, classes: string }> = {
    "not_started": { 
      label: "Not Started", 
      classes: "bg-red-50 text-red-700 border-red-100" 
    },
    "work_in_progress": { 
      label: "Work in Progress", 
      classes: "bg-yellow-50 text-yellow-700 border-yellow-200" 
    },
    "pending_to_deliver": { 
      label: "Pending to Deliver", 
      classes: "bg-amber-50 text-amber-700 border-amber-200" 
    },
    "delivered": { 
      label: "Delivered", 
      classes: "bg-green-50 text-green-700 border-green-100" 
    },
    "completed": { 
      label: "Completed", 
      classes: "bg-green-50 text-green-700 border-green-100" 
    }
  };

  const { label, classes } = statusConfig[normalizedStatus] || { 
    label: status.replace(/_/g, ' '), 
    classes: "bg-gray-100 text-gray-700 border-gray-200" 
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", classes)}>
      {label}
    </span>
  );
}
