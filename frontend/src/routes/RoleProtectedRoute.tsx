import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type User } from "../contexts/AuthContext";
import { LoadingComponent } from "../components/LoadingComponent";

interface RoleProtectedRouteProps {
  allowedRoles: User["role"][];
}

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Role not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
