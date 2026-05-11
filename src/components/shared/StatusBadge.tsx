import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase().trim();
  const label = status.replace(/_/g, ' ');

  let colorClasses = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"; // default

  if (["COMPLETED", "DELIVERED", "PAID"].includes(normalizedStatus)) {
    colorClasses = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
  } else if (["PENDING", "PARTIAL", "IN_PROGRESS"].includes(normalizedStatus)) {
    colorClasses = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
  } else if (["WAITING_FOR_PARTS", "CANCELLED", "OVERDUE"].includes(normalizedStatus)) {
    colorClasses = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", colorClasses)}>
      {label}
    </span>
  );
}
