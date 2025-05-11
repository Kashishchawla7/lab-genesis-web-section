import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Check,
  X,
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

interface BookingNotification {
  id: string;
  message: string;
  status: string;
  admin_action: string;
  created_at: string;
  updated_at: string;
  read_by_admin: boolean;
  booking_id: string;
  bookings: {
    name: string | null;
    email: string | null;
    phone: string | null;
    appointment_date: string;
    appointment_time: string;
    test_package_id: string;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "sample_collected", label: "Sample Collected" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const AdminNotifications = () => {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: notifications, isLoading, error, refetch } = useQuery({
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

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const initialStatuses: Record<string, string> = {};
      notifications.forEach(notification => {
        initialStatuses[notification.id] = notification.admin_action || "pending";
      });
      setStatuses(initialStatuses);
    }
  }, [notifications]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-booking-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_notifications",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = async (notificationId: string, status: string) => {
    const currentStatus = statuses[notificationId];
    if (currentStatus === "completed") {
      toast({
        variant: "destructive",
        title: "Cannot Update Status",
        description: "Status cannot be changed once it is completed",
      });
      return;
    }

    try {
      setStatuses(prev => ({
        ...prev,
        [notificationId]: status,
      }));

      const { error } = await supabase
        .from("booking_notifications")
        .update({
          admin_action: status,
          read_by_admin: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Notification status updated to ${status}`,
      });

      setOpenDropdown(null);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });

      setStatuses(prev => {
        const original = notifications?.find(n => n.id === notificationId);
        return {
          ...prev,
          [notificationId]: original?.admin_action || "pending",
        };
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("booking_notifications")
        .update({ read_by_admin: true })
        .eq("id", id);
      if (error) throw error;
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
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
      case "in_progress":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg transition-all ${
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
                {getStatusBadge(statuses[notification.id] || "pending")}
                {statuses[notification.id] !== "completed" && (
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenDropdown(openDropdown === notification.id ? null : notification.id)}
                    >
                      Change Status
                    </Button>
                    {openDropdown === notification.id && (
                      <div className="absolute z-10 mt-2 w-40 bg-white border rounded shadow">
                        {STATUS_OPTIONS.filter(opt => opt.value !== statuses[notification.id]).map((opt) => (
                          <div
                            key={opt.value}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleStatusChange(notification.id, opt.value)}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

                <div className="flex gap-2 items-center">
                  {!notification.read_by_admin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
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
          <p className="mt-2 text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
