import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "@/pages/dashboard";
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
        element: <div>Customers Page</div>,
      },
      {
        path: "/repairs",
        element: <div>Repairs Page</div>,
      },
      {
        path: "/products",
        element: <div>Products Page</div>,
      },
    ],
  },
  {
    path: "/login",
    element: <div>Login Page</div>,
  },
]);
