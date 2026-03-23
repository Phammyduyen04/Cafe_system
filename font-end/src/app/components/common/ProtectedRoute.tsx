import { Navigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user?.roles ?? [];
  const userType = user?.userType ?? "";

  const hasAccess = allowedRoles.some(
    (role) => userRoles.includes(role) || userType === role
  );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
