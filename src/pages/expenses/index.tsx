import { useEffect, useState, useMemo } from "react";
import { expenseService } from "@/services/expense.service";
import {
  Eye, Trash2, Edit, Receipt, AlertCircle, DollarSign
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/TextArea";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Drawer } from "@/components/shared/Drawer";
import { Modal } from "@/components/shared/Modal";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { toast } from "sonner";

interface Expense {
  id: string;
  expenseName: string;
  amount: number;
  description?: string;
  hasBill: boolean;
  expenseDate: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const [startDate, setStartDate] = useState(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatLocalDate(now));

  const [formData, setFormData] = useState({
    expenseName: "",
    amount: 0,
    description: "",
    hasBill: false,
    expenseDate: formatLocalDate(now)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getExpenses(1, 1000, "", startDate, endDate);
      setExpenses(res.data || []);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.expenseName) newErrors.expenseName = "Expense name is required";
    if (formData.amount <= 0) newErrors.amount = "Amount must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, formData);
        toast.success("Expense updated successfully");
      } else {
        await expenseService.createExpense({
          ...formData,
          amount: Number(formData.amount)
        });
        toast.success("Expense created successfully");
      }

      setFormData({
        expenseName: "",
        amount: 0,
        description: "",
        hasBill: false,
        expenseDate: formatLocalDate(now)
      });
      setEditingExpense(null);
      setIsDrawerOpen(false);
      setErrors({});
      fetchExpenses();
    } catch (error: any) {
      console.error("Error submitting expense", error);
      toast.error(error.response?.data?.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseName: expense.expenseName,
      amount: expense.amount,
      description: expense.description || "",
      hasBill: expense.hasBill || false,
      expenseDate: expense.expenseDate.split('T')[0]
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await expenseService.deleteExpense(expenseToDelete);
      toast.success("Expense deleted successfully");
      setExpenseToDelete(null);
      setIsDeleteConfirmOpen(false);
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete expense");
    }
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const columns: Column<Expense>[] = [
    {
      header: "Expense Name",
      accessor: "expenseName",
      render: (exp) => (
        <span className="font-semibold text-foreground text-sm">{exp.expenseName}</span>
      )
    },
    {
      header: "Amount",
      accessor: "amount",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (exp) => (
        <span className="font-semibold text-foreground text-sm tabular-nums">
          ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: "Date",
      accessor: "expenseDate",
      render: (exp) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: "Recorded By",
      accessor: "user",
      render: (exp) => (
        <span className="text-sm text-muted-foreground">{exp.user?.fullName || "Unknown"}</span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (exp) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setSelectedExpense(exp);
              setIsViewModalOpen(true);
            }}
            className="h-8 w-8 flex items-center justify-center bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(exp)}
            className="h-8 w-8 flex items-center justify-center bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setExpenseToDelete(exp.id);
              setIsDeleteConfirmOpen(true);
            }}
            className="h-8 w-8 flex items-center justify-center bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-700">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Total Expenses
              </p>
              <p className="text-3xl font-black text-primary tabular-nums">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Total Records
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {expenses.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Avg. Expense
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                ₹{(expenses.length > 0 ? totalAmount / expenses.length : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <DataTable
        data={expenses}
        columns={columns}
        loading={loading}
        loadingMessage="Loading expenses..."
        emptyMessage="No expenses recorded yet."
        emptyIcon={<Receipt className="h-12 w-12" />}
        title="Expense Ledger"
        searchable
        searchPlaceholder="Search expenses..."
        paginated
        onAddClick={() => {
          setEditingExpense(null);
          setFormData({
            expenseName: "",
            amount: 0,
            description: "",
            hasBill: false,
            expenseDate: formatLocalDate(now)
          });
          setErrors({});
          setIsDrawerOpen(true);
        }}
        addLabel="Record Expense"
        toolbarExtra={
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        }
      />

      {/* Expense Form Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingExpense(null);
          setFormData({
            expenseName: "",
            amount: 0,
            description: "",
            hasBill: false,
            expenseDate: formatLocalDate(now)
          });
          setErrors({});
        }}
        title={editingExpense ? "Edit Expense" : "Record New Expense"}
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsDrawerOpen(false);
                setEditingExpense(null);
                setFormData({
                  expenseName: "",
                  amount: 0,
                  description: "",
                  hasBill: false,
                  expenseDate: formatLocalDate(now)
                });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editingExpense ? "Update Expense" : "Record Expense"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pb-20">
          <div className="space-y-4">
            <Input
              label="Expense Name"
              placeholder="e.g., Office Rent, Electricity Bill..."
              value={formData.expenseName}
              onChange={(e) => {
                setFormData({ ...formData, expenseName: e.target.value });
                if (errors.expenseName) setErrors({ ...errors, expenseName: "" });
              }}
              error={errors.expenseName}
              required
              icon={<Receipt className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-4">
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="0.00"
              value={formData.amount || ""}
              onChange={(e) => {
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
                if (errors.amount) setErrors({ ...errors, amount: "" });
              }}
              error={errors.amount}
              required
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-foreground">Bill Available</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="hasBill"
                  value="yes"
                  checked={formData.hasBill === true}
                  onChange={() => setFormData({ ...formData, hasBill: true })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Yes</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="hasBill"
                  value="no"
                  checked={formData.hasBill === false}
                  onChange={() => setFormData({ ...formData, hasBill: false })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">No</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Expense Date"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <TextArea
              label="Description (Optional)"
              placeholder="Add additional details about this expense..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </Drawer>

      {/* View Expense Modal */}
      {selectedExpense && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Expense Details"
          size="md"
          footer={
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  handleEdit(selectedExpense);
                  setIsViewModalOpen(false);
                }}
              >
                Edit
              </Button>
            </div>
          }
        >
          <div className="space-y-6 py-4">
            <div className="border-b pb-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Expense Name</p>
              <p className="text-lg font-bold text-foreground">{selectedExpense.expenseName}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Amount</p>
              <p className="text-lg font-black text-primary tabular-nums">
                ₹{Number(selectedExpense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Bill Available</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm" style={{backgroundColor: selectedExpense.hasBill ? '#10b98120' : '#ef444420', color: selectedExpense.hasBill ? '#059669' : '#dc2626'}}>
                {selectedExpense.hasBill ? '✓ Yes' : '✗ No'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(selectedExpense.expenseDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recorded By</p>
                <p className="text-sm font-semibold text-foreground">{selectedExpense.user?.fullName}</p>
              </div>
            </div>

            {selectedExpense.description && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-foreground">{selectedExpense.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Expense"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
