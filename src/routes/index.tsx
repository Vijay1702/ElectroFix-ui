import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/dashboard";
import CustomersPage from "@/pages/customers";
import RepairsPage from "@/pages/repairs";
import ProductsPage from "@/pages/products";
import InvoicesPage from "@/pages/invoices";
import PaymentsPage from "@/pages/payments";
import AppLayout from "@/components/layout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "/customers",
        element: <CustomersPage />,
      },
      {
        path: "/repairs",
        element: <RepairsPage />,
      },
      {
        path: "/products",
        element: <ProductsPage />,
      },
      {
        path: "/invoices",
        element: <InvoicesPage />,
      },
      {
        path: "/payments",
        element: <PaymentsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <div>Login Page</div>,
  },
]);
