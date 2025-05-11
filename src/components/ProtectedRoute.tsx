import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First get the user's role from user_roles table
      const { data: userRoleData, error: userRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRoleError) {
        console.error("Error fetching user role:", userRoleError);
        return null;
      }

      // Then get the role details from roles table
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("name", userRoleData.role)
        .single();

      if (roleError) {
        console.error("Error fetching role details:", roleError);
        return null;
      }

      return roleData as { name: string } | null;
    },
    enabled: !!user,
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role.name))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
