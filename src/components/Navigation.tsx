import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Calendar, Settings, Bell, Users } from "lucide-react";
import logo from "@/assets/logo.png";

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

  console.log(user);
  const { data: role } = useQuery({
    queryKey: ["userRole", user?.id],
    
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single<{ role_id: string }>();

      if (error || !data) throw error || new Error("No role found");
      console.log(data);

      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id, name, menu_items")
        .eq("name", data.role)
        .single();

      if (roleError) throw roleError;
      return {
        ...roleData,
        menu_items: typeof roleData.menu_items === 'string' 
          ? JSON.parse(roleData.menu_items) 
          : roleData.menu_items
      } as Role;
    },
    enabled: !!user,
  });

  const menuItems = role?.menu_items || [];
  console.log(menuItems);
  console.log(role);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Ahuja Lab" className="w-[70px] h-[70px] object-contain" />
                <div className="hidden md:flex flex-col ml-2">
                  <span className="text-xl font-bold text-blue-600">Ahuja Lab</span>
                  <span className="text-sm text-gray-600">Your Health Is Our Priority</span>
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-6">
              {menuItems.map((item) => {
                const Icon = iconMap[item.icon] || Home;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${
                      location.pathname === item.path ? "mr-2" : "mr-2"
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    Welcome back
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/auth">
                  <Button 
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="md:hidden">
        {/* Add mobile menu implementation if needed */}
      </div>
    </nav>
  );
};

export default Navigation;
