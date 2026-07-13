import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { GlobalLayout } from "../layouts/GlobalLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleProtectedRoute } from "./RoleProtectedRoute";
import { LoadingComponent } from "../components/LoadingComponent";

// Lazy loading all pages for performance
const LandingPage = lazy(() => import("../pages/LandingPage").then(m => ({ default: m.LandingPage })));
const NotFound = lazy(() => import("../pages/NotFound").then(m => ({ default: m.NotFound })));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import("../features/auth/pages/VerifyEmailPage").then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

const CustomerDashboardPage = lazy(() => import("../features/dashboard/pages/CustomerDashboardPage").then(m => ({ default: m.CustomerDashboardPage })));
const CreateOrderPage = lazy(() => import("../features/orders/pages/CreateOrderPage").then(m => ({ default: m.CreateOrderPage })));
const OrderListPage = lazy(() => import("../features/orders/pages/OrderListPage").then(m => ({ default: m.OrderListPage })));
const TrackingPage = lazy(() => import("../features/tracking/pages/TrackingPage").then(m => ({ default: m.TrackingPage })));

const AgentDashboardPage = lazy(() => import("../features/agent/pages/AgentDashboardPage").then(m => ({ default: m.AgentDashboardPage })));
const AdminDashboardPage = lazy(() => import("../features/admin/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const ZonesPage = lazy(() => import("../features/admin/pages/ZonesPage").then(m => ({ default: m.ZonesPage })));
const AreasPage = lazy(() => import("../features/admin/pages/AreasPage").then(m => ({ default: m.AreasPage })));
const RateCardsPage = lazy(() => import("../features/admin/pages/RateCardsPage").then(m => ({ default: m.RateCardsPage })));
const AgentsPage = lazy(() => import("../features/admin/pages/AgentsPage").then(m => ({ default: m.AgentsPage })));
const UsersPage = lazy(() => import("../features/admin/pages/UsersPage").then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import("../features/admin/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AdminOrdersPage = lazy(() => import("../features/admin/pages/AdminOrdersPage").then(m => ({ default: m.AdminOrdersPage })));

// A helper wrapper to simplify suspense boundary
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <GlobalLayout />,
    errorElement: (
      <Lazy>
        <NotFound />
      </Lazy>
    ),
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <LandingPage />
          </Lazy>
        ),
      },
      {
        path: "login",
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: "login/customer",
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: "login/agent",
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: "login/admin",
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: "register",
        element: (
          <Lazy>
            <RegisterPage />
          </Lazy>
        ),
      },
      {
        path: "verify-email",
        element: (
          <Lazy>
            <VerifyEmailPage />
          </Lazy>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <Lazy>
            <ForgotPasswordPage />
          </Lazy>
        ),
      },
      {
        path: "reset-password",
        element: (
          <Lazy>
            <ResetPasswordPage />
          </Lazy>
        ),
      },
      {
        path: "unauthorized",
        element: (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
              <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-500">You don't have permission to view this page.</p>
            </div>
          </div>
        ),
      },
      // Protected routes wrapped in Dashboard Layout
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              // Customer Specific Routes
              {
                element: <RoleProtectedRoute allowedRoles={["CUSTOMER"]} />,
                children: [
                  {
                    path: "dashboard",
                    element: (
                      <Lazy>
                        <CustomerDashboardPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "orders",
                    element: (
                      <Lazy>
                        <OrderListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              // Shared Customer & Admin Routes
              {
                element: <RoleProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]} />,
                children: [
                  {
                    path: "orders/create",
                    element: (
                      <Lazy>
                        <CreateOrderPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "tracking",
                    element: (
                      <Lazy>
                        <TrackingPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "tracking/:orderId",
                    element: (
                      <Lazy>
                        <TrackingPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              // Agent Routes
              {
                element: <RoleProtectedRoute allowedRoles={["AGENT"]} />,
                children: [
                  {
                    path: "agent",
                    element: (
                      <Lazy>
                        <AgentDashboardPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              // Admin Routes
              {
                element: <RoleProtectedRoute allowedRoles={["ADMIN"]} />,
                children: [
                  {
                    path: "admin",
                    element: (
                      <Lazy>
                        <AdminDashboardPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "admin/orders",
                    element: (
                      <Lazy>
                        <AdminOrdersPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "admin/zones",
                    element: (
                      <Lazy>
                        <ZonesPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "admin/areas",
                    element: (
                      <Lazy>
                        <AreasPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "admin/rate-cards",
                    element: (
                      <Lazy>
                        <RateCardsPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "admin/agents",
                    element: (
                      <Lazy>
                        <AgentsPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "users",
                    element: (
                      <Lazy>
                        <UsersPage />
                      </Lazy>
                    ),
                  },
                  {
                    path: "settings",
                    element: (
                      <Lazy>
                        <SettingsPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
