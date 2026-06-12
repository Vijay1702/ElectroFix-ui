import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().trim();
  
  const statusConfig: Record<string, { label: string, classes: string }> = {
    "active": { 
      label: "Active", 
      classes: "bg-green-50 text-green-700 border-green-200" 
    },
    "inactive": { 
      label: "Inactive", 
      classes: "bg-red-50 text-red-700 border-red-200" 
    },
    "paid": { 
      label: "Paid", 
      classes: "bg-green-50 text-green-700 border-green-200" 
    },
    "pending": { 
      label: "Pending", 
      classes: "bg-amber-50 text-amber-700 border-amber-200" 
    },
    "partially_paid": { 
      label: "Partial", 
      classes: "bg-blue-50 text-blue-700 border-blue-200" 
    },
    "unpaid": { 
      label: "Unpaid", 
      classes: "bg-red-50 text-red-700 border-red-200" 
    },
    "not_started": { 
      label: "Not Started", 
      classes: "bg-gray-50 text-gray-700 border-gray-200" 
    },
    "work_in_progress": { 
      label: "Work in Progress", 
      classes: "bg-blue-50 text-blue-700 border-blue-200" 
    },
    "pending_to_deliver": { 
      label: "Pending to Deliver", 
      classes: "bg-amber-50 text-amber-700 border-amber-200" 
    },
    "delivered": { 
      label: "Delivered", 
      classes: "bg-green-50 text-green-700 border-green-200" 
    },
    "completed": { 
      label: "Completed", 
      classes: "bg-green-50 text-green-700 border-green-200" 
    },
    "declined": { 
      label: "Declined", 
      classes: "bg-red-50 text-red-700 border-red-200" 
    }
  };

  const { label, classes } = statusConfig[normalizedStatus] || { 
    label: status.replace(/_/g, ' '), 
    classes: "bg-gray-50 text-gray-700 border-gray-200" 
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded text-xs font-semibold border inline-flex items-center justify-center", classes)}>
      {label}
    </span>
  );
}
