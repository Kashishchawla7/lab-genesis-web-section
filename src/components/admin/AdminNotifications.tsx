
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
  request_status: string; // New field for tracking request status
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

const AdminNotifications = () => {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({}); // For the new request status workflow
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Use React Query to fetch notifications from the database
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      console.log("Fetching admin notifications");
      const { data, error } = await supabase
        .from("booking_notifications")
        .select(`
          id, 
          message, 
          status, 
          admin_action,
          request_status, 
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

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }
      
      console.log("Admin notifications data:", data);
      return data || [];
    },
  });

  // Initialize statuses from fetched notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const initialStatuses: Record<string, string> = {};
      const initialRequestStatuses: Record<string, string> = {};
      
      notifications.forEach(notification => {
        initialStatuses[notification.id] = notification.admin_action || 'pending';
        initialRequestStatuses[notification.id] = notification.request_status || 'pending';
      });
      
      setStatuses(initialStatuses);
      setRequestStatuses(initialRequestStatuses);
    }
  }, [notifications]);

  // Set up real-time subscription for booking notifications
  useEffect(() => {
    console.log("Setting up real-time subscription for admin notifications");
    const channel = supabase
      .channel('admin-booking-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_notifications'
        },
        (payload) => {
          console.log("Real-time notification update:", payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Toggle expanded row
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle status change
  const handleStatusChange = async (notificationId: string, status: string) => {
    try {
      console.log(`Updating notification ${notificationId} to status ${status}`);
      
      setStatuses(prev => ({
        ...prev,
        [notificationId]: status
      }));

      const { error } = await supabase
        .from("booking_notifications")
        .update({
          admin_action: status,
          read_by_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error updating notification:", error);
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Notification status updated to ${status}`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      
      // Revert status on error
      setStatuses(prev => {
        const notification = notifications?.find(n => n.id === notificationId);
        return {
          ...prev,
          [notificationId]: notification?.admin_action || 'pending'
        };
      });
    }
  };

  // Handle request status change (new function)
  const handleRequestStatusChange = async (notificationId: string, status: string) => {
    try {
      console.log(`Updating request status for notification ${notificationId} to ${status}`);
      
      setRequestStatuses(prev => ({
        ...prev,
        [notificationId]: status
      }));

      // Update the booking notification
      const { error } = await supabase
        .from("booking_notifications")
        .update({
          request_status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error updating request status:", error);
        throw error;
      }

      // Find the booking ID to update the booking status as well
      const notification = notifications?.find(n => n.id === notificationId);
      if (notification && notification.booking_id) {
        // Update the booking status to match
        const { error: bookingError } = await supabase
          .from("bookings")
          .update({ status: status })
          .eq("id", notification.booking_id);
          
        if (bookingError) {
          console.error("Error updating booking status:", bookingError);
          throw bookingError;
        }
      }

      toast({
        title: "Request Status Updated",
        description: `Request status updated to ${status}`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error in handleRequestStatusChange:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      
      // Revert status on error
      setRequestStatuses(prev => {
        const notification = notifications?.find(n => n.id === notificationId);
        return {
          ...prev,
          [notificationId]: notification?.request_status || 'pending'
        };
      });
    }
  };

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("booking_notifications")
        .update({ read_by_admin: true })
        .eq("id", id);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> In Progress</Badge>;
      case 'sample_collected':
        return <Badge variant="blue" className="flex items-center gap-1"><Check className="h-3 w-3" /> Sample Collected</Badge>;
      case 'report_generated':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Report Generated</Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
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
                    {notification.bookings?.name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(statuses[notification.id] || notification.admin_action || 'pending')}
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
            
            {/* Expanded details */}
            {expandedRows[notification.id] && (
              <div className="mt-4 border-t pt-4 space-y-4">
                {/* Booking details */}
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
                
                {/* Request Status Selection - New Feature */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium mb-2">Request Status</p>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <div className="w-full sm:w-1/2">
                      <Select 
                        value={requestStatuses[notification.id] || notification.request_status || 'pending'} 
                        onValueChange={(value) => handleRequestStatusChange(notification.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sample_collected">Sample Collected</SelectItem>
                          <SelectItem value="report_generated">Report Generated</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-1/2 text-sm text-gray-500">
                      Current: {getStatusBadge(requestStatuses[notification.id] || notification.request_status || 'pending')}
                    </div>
                  </div>
                </div>
                
                {/* Standard Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleStatusChange(notification.id, 'approved')}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleStatusChange(notification.id, 'rejected')}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => handleStatusChange(notification.id, 'in_progress')}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    In Progress
                  </Button>
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
