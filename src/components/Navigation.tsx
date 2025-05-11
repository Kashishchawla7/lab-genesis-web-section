
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Calendar, Settings, Bell, Users } from "lucide-react";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  calendar: Calendar,
  settings: Settings,
  bell: Bell,
  users: Users,
};

const Navigation = () => {
  const location = useLocation();

  // Default menu items available to all users
  const menuItems: MenuItem[] = [
    { id: 'home', name: 'Home', path: '/', icon: 'home' },
    { id: 'book', name: 'Book Test', path: '/book', icon: 'calendar' },
    { id: 'notifications', name: 'Notifications', path: '/notifications', icon: 'bell' },
    { id: 'master-data', name: 'Admin', path: '/master-data', icon: 'settings' },
    { id: 'manage-tests', name: 'Manage Tests', path: '/manage-tests', icon: 'settings' },
    { id: 'role-config', name: 'Role Config', path: '/role-config', icon: 'users' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Ahuja Path Labs" className="w-[137px] h-[123px] object-contain" />
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
        </div>
      </div>
      <div className="md:hidden">
        {/* Mobile menu implementation could be added here */}
      </div>
    </nav>
  );
};

export default Navigation;
