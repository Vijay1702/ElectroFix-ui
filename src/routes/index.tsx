import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardPage from "@/pages/dashboard";
import CustomersPage from "@/pages/customers";
import RepairsPage from "@/pages/repairs";
import ProductsPage from "@/pages/products";
import InvoicesPage from "@/pages/invoices";
import PaymentsPage from "@/pages/payments";
import OnboardingPage from "@/pages/onboarding";
import AttendancePage from "@/pages/attendance";
import LoginPage from "@/pages/auth/LoginPage";
import AppLayout from "@/components/layout/AppLayout";
import { authService } from "@/services/auth.service";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/onboarding",
        element: <OnboardingPage />,
      },
      {
        path: "/attendance",
        element: <AttendancePage />,
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
    element: <LoginPage />,
  },
]);
