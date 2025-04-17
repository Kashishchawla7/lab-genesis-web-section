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

  const { data: role } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .single<{ role_id: string }>();

      if (error || !data) throw error || new Error("No role found");

      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("id", data.role_id)
        .single();

      if (roleError) throw roleError;
      return roleData as { name: string };
    },
    enabled: !!user,
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role.name))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
