
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingNotification {
  id: string;
  message: string;
  admin_action: string;
  created_at: string;
  read_by_admin: boolean;
  bookings: {
    name: string | null;
    email: string | null;
    phone: string | null;
    appointment_date: string;
    appointment_time: string;
    test_package_id: string;
  } | null;
}

const AdminNotifications = () => {
  const { toast } = useToast();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("pending");

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_notifications")
        .select(`
          id, 
          message, 
          status, 
          admin_action, 
          created_at, 
          updated_at, 
          read_by_admin,
          booking_id,
          request_status,
          bookings (
            id, 
            name, 
            email, 
            phone,
            appointment_date,
            appointment_time,
            test_package_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = async (notificationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("booking_notifications")
        .update({
          admin_action: status,
          read_by_admin: true,
        })
        .eq("id", notificationId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Notification status updated to ${status}`,
      });

      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update notification status",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "sample_collected":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3" /> Sample Collected
          </Badge>
        );
      case "done":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" /> Done
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredNotifications = notifications?.filter(notification => {
    const status = notification.admin_action || "pending";
    return status === activeTab;
  });

  const getStatusOptions = (currentStatus: string) => {
    const options = [
      { value: "pending", label: "Pending" },
      { value: "sample_collected", label: "Sample Collected" },
      { value: "done", label: "Done" },
    ];

    return options.filter(option => option.value !== currentStatus);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p>Error loading notifications</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="sample_collected">Sample Collected</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredNotifications && filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-all mb-4 ${
                  notification.read_by_admin ? "bg-white" : "bg-blue-50 border-blue-200"
                } ${expandedRows[notification.id] ? "shadow-md" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {!notification.read_by_admin && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    <div>
                      <h3 className="font-medium">
                        {notification.bookings?.name || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(notification.admin_action || "pending")}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRow(notification.id)}
                    >
                      {expandedRows[notification.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedRows[notification.id] && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p>{notification.bookings?.email}</p>
                        <p>{notification.bookings?.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Appointment</p>
                        <p>Date: {new Date(notification.bookings?.appointment_date).toLocaleDateString()}</p>
                        <p>Time: {notification.bookings?.appointment_time}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Select
                        onValueChange={(value) => handleStatusChange(notification.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions(notification.admin_action || "pending").map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-gray-500">No notifications in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
