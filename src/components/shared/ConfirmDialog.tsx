import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { AlertCircle, LogOut, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  icon?: "logout" | "delete" | "alert";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon = "alert"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case "logout": return <LogOut className="h-6 w-6 text-red-500" />;
      case "delete": return <Trash2 className="h-6 w-6 text-red-500" />;
      default: return <AlertCircle className="h-6 w-6 text-primary" />;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "danger": return "bg-red-50 text-red-700 border-red-100";
      case "warning": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-card w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={cn("p-3 rounded-2xl border", getVariantClasses())}>
              {getIcon()}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <h3 className="text-2xl font-bold mb-2 text-foreground tracking-tight">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">{description}</p>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 rounded-2xl font-semibold"
            >
              {cancelText}
            </Button>
            <Button 
              variant={variant === "danger" ? "danger" : "primary"} 
              onClick={() => {
                onConfirm();
                onClose();
              }} 
              className="flex-1 h-12 rounded-2xl font-semibold shadow-lg shadow-primary/20"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
