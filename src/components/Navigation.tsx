import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Calendar, Settings, Bell, Users, FileText, Database, UserCog } from "lucide-react";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  roles?: string[]; // Optional array of roles that can access this menu item
}

interface Role {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

// Map of icon names to their components
const iconMap: { [key: string]: React.ElementType } = {
  home: Home,
  calendar: Calendar,
  settings: Settings,
  bell: Bell,
  users: Users,
  file: FileText,
  database: Database,
  admin: UserCog,
};

const defaultMenuItems: MenuItem[] = [
  { id: 'home', name: 'Home', path: '/', icon: 'home' },
  { id: 'book', name: 'Book Test', path: '/book', icon: 'calendar' },
];

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Query for user role and menu items
  const { data: role, isLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First, get the user's role
      const { data: userRoleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !userRoleData) {
        console.error("Error fetching user role:", error);
        return null;
      }

      // Then, fetch the role details with menu items
      const { data: roleDetails, error: roleError } = await supabase
        .from("roles")
        .select("id, name, menu_items")
        .eq("name", userRoleData.role)
        .single();

      if (roleError) {
        console.error("Error fetching role details:", roleError);
        return null;
      }

      // Parse menu items if they're stored as a string
      const menuItems = typeof roleDetails.menu_items === 'string' 
        ? JSON.parse(roleDetails.menu_items) 
        : roleDetails.menu_items;

      return {
        ...roleDetails,
        menu_items: menuItems
      } as Role;
    },
    enabled: !!user,
    gcTime: 30 * 60 * 1000, // Cache is kept for 30 minutes
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
  });

  // Get menu items from role or use default items if no role
  const menuItems = user ? (role?.menu_items || []) : defaultMenuItems;

  // Filter menu items based on user's role
  const filteredMenuItems = menuItems.filter(item => {
    // If no roles specified, item is accessible to all roles
    if (!item.roles) return true;
    // Otherwise, check if user's role is in the allowed roles
    return item.roles.includes(role?.name || '');
  });

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
              {filteredMenuItems.map((item) => {
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
                    <Icon className="h-5 w-5 mr-2" />
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
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
