const DashboardPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Placeholder for dashboard cards */}
        <div className="p-4 bg-card border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Repairs</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-card border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Repairs</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-card border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Customers</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-card border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
