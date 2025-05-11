
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

// Map of icon names to their components
const iconMap: { [key: string]: React.ElementType } = {
  home: Home,
  calendar: Calendar,
  settings: Settings,
  bell: Bell,
  users: Users,
};

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Query for unread notifications count (for users)
  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from("booking_notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("read_by_user", false);
      
      if (error) {
        console.error("Error fetching notification count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for unread admin notifications count
  const { data: adminUnreadCount } = useQuery({
    queryKey: ["admin-notifications-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      
      if (!roleData) return 0;
      
      // Get count of unread admin notifications
      const { count, error } = await supabase
        .from("booking_notifications")
        .select("*", { count: 'exact', head: true })
        .eq("read_by_admin", false);
      
      if (error) {
        console.error("Error fetching admin notification count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Default menu items if no role is found
  const defaultMenuItems: MenuItem[] = [
    { id: 'home', name: 'Home', path: '/', icon: 'home' },
    { id: 'book', name: 'Book Test', path: '/book', icon: 'calendar' },
  ];

  const { data: role, isLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First, get the user's role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !roleData) {
        console.error("Error fetching user role:", error);
        return null;
      }

      // Then, fetch the role details with menu items
      const { data: roleDetails, error: roleError } = await supabase
        .from("roles")
        .select("id, name, menu_items")
        .eq("name", roleData.role)
        .single();

      if (roleError) {
        console.error("Error fetching role details:", roleError);
        return null;
      }

      return {
        ...roleDetails,
        menu_items: typeof roleDetails.menu_items === 'string' 
          ? JSON.parse(roleDetails.menu_items) 
          : roleDetails.menu_items
      } as Role;
    },
    enabled: !!user,
    // Use default menu items if no role is found
    placeholderData: { menu_items: defaultMenuItems } as Role
  });

  const menuItems = role?.menu_items || defaultMenuItems;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Ahuja Path Labs" className="w-[137px] h-[123px] object-contain" />
                {/* <div className="hidden md:flex flex-col ml-2">
                  <span className="text-xl font-bold text-blue-600">Ahuja Path Labs</span>
                  <span className="text-sm text-gray-600">Your Health Is Our Priority</span>
                </div> */}
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
        {/* TODO: Add mobile menu implementation */}
      </div>
    </nav>
  );
};

export default Navigation;
