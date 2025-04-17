import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Trash2 } from "lucide-react";

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

const defaultMenuItems: MenuItem[] = [
  { id: "1", name: "Dashboard", path: "/", icon: "home" },
  { id: "2", name: "Book Test", path: "/book", icon: "calendar" },
  { id: "3", name: "Manage Tests", path: "/manage-tests", icon: "settings" },
  { id: "4", name: "Notifications", path: "/notifications", icon: "bell" },
  { id: "5", name: "Role Config", path: "/role-config", icon: "users" },
];

const RoleConfig = () => {
  const [newRoleName, setNewRoleName] = useState("");
  const { toast } = useToast();

  const { data: roles, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*");
      
      if (error) throw error;
      return data as Role[];
    },
  });

  const createRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      const { error } = await supabase
        .from("roles")
        .insert([
          {
            name: newRoleName,
            menu_items: defaultMenuItems,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role created successfully",
      });

      setNewRoleName("");
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create role",
      });
    }
  };

  const updateRoleMenu = async (roleId: string, menuItems: MenuItem[]) => {
    try {
      const { error } = await supabase
        .from("roles")
        .update({ menu_items: menuItems })
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role configuration updated successfully",
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role configuration",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete role",
      });
    }
  };

  const toggleMenuItem = (role: Role, menuItemId: string) => {
    const updatedMenuItems = role.menu_items.some(item => item.id === menuItemId)
      ? role.menu_items.filter(item => item.id !== menuItemId)
      : [...role.menu_items, defaultMenuItems.find(item => item.id === menuItemId)!];
    
    updateRoleMenu(role.id, updatedMenuItems);
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">
          Role Configuration
        </h1>

        {/* Create New Role */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
          <div className="flex gap-4">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name"
            />
            <Button onClick={createRole}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-8">
          {roles?.map((role) => (
            <div key={role.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{role.name}</h3>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteRole(role.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {defaultMenuItems.map((menuItem) => (
                  <div
                    key={menuItem.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={role.menu_items.some(item => item.id === menuItem.id)}
                        onCheckedChange={() => toggleMenuItem(role, menuItem.id)}
                      />
                      <span>{menuItem.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{menuItem.path}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleConfig; 