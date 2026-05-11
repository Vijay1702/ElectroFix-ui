import { useEffect, useState } from "react";
import { invoiceService } from "@/services/finance.service";
import { Plus, Search, Filter, Printer, FileText, Download } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices(page, limit, search);
      setInvoices(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing, print invoices, and track payments.</p>
        </div>
        <button className="primary-button flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Invoice
        </button>
      </div>

      <div className="card-container p-0 overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoice number..."
                className="input-style w-full pl-9 h-10 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-muted font-medium transition-colors">
              <Filter className="h-4 w-4" />
              Filter by Status
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice No.</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="bg-background hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{invoice.customer?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{invoice.repairJob?.jobNumber && `Ref: ${invoice.repairJob.jobNumber}`}</div>
                    </td>
                    <td className="px-6 py-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${Number(invoice.grandTotal).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' : 
                          invoice.paymentStatus === 'PARTIAL' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                          'bg-red-100 text-red-700 border-red-200'}`}>
                        {invoice.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-muted-foreground hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" title="Print">
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/10">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit) || 1}
          </span>
          <button 
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
