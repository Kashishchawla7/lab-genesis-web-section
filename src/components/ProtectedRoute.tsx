import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Simply render the children without any authentication checks
  return <>{children}</>;
};

export default ProtectedRoute;
