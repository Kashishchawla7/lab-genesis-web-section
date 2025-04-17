import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Calendar, Settings, Bell, Users } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
}

interface Role {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

interface UserRole {
  role_id: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  calendar: Calendar,
  settings: Settings,
  bell: Bell,
  users: Users,
};

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

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
        .select("*")
        .eq("id", data.role_id)
        .single();

      if (roleError) throw roleError;
      return roleData as Role;
    },
    enabled: !!user,
  });

  const menuItems = role?.menu_items || [];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Lab Genesis
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item) => {
                const Icon = iconMap[item.icon] || Home;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-1" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
