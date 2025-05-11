import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, X, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

// Simplified notification type for general notifications
interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

// Type for booking notifications
interface BookingNotification {
  id: string;
  booking_id: string;
  message: string;
  status: string;
  admin_action: string;
  request_status: string;
  read_by_user: boolean;
  created_at: string;
  updated_at: string;
}

const Notifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Query for user role
  const { data: userRole } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: userRoleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return userRoleData as { role: string } | null;
    },
    enabled: !!user,
  });

  const isAdmin = userRole?.role === 'admin';

  // Query for general notifications
  const { data: generalNotifications, refetch: refetchGeneral } = useQuery({
    queryKey: ["general-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Query for booking notifications
  const { data: bookingNotifications, refetch: refetchBookings } = useQuery({
    queryKey: ["booking-notifications", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("booking_notifications")
        .select(`
          id,
          booking_id,
          message,
          status,
          admin_action,
          request_status,
          read_by_user,
          created_at,
          updated_at,
          user_id
        `)
        .order("created_at", { ascending: false });

      // Only filter by user_id if not admin
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching booking notifications:", error);
        throw error;
      }
      
      return data as BookingNotification[];
    },
    enabled: !!user,
  });

  // Set up real-time subscription for booking notifications
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('booking-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchBookings]);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const { error } = await supabase
  //       .from("notifications")
  //       .insert([
  //         {
  //           title,
  //           message,
  //           is_read: false,
  //         },
  //       ]);

  //     if (error) throw error;

  //     toast({
  //       title: "Success",
  //       description: "Notification sent successfully",
  //     });

  //     setTitle("");
  //     setMessage("");
  //     refetchGeneral();
  //   } catch (error) {
  //     toast({
  //       variant: "destructive",
  //       title: "Error",
  //       description: "Failed to send notification",
  //     });
  //   }
  // };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      refetchGeneral();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
    }
  };

  const markBookingNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("booking_notifications")
        .update({ read_by_user: true })
        .eq("id", id);

      if (error) throw error;
      refetchBookings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      refetchGeneral();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notification",
      });
    }
  };

  // Get unique admin actions for tabs, excluding sample_collected as it will be handled separately
  const uniqueAdminActions = bookingNotifications 
    ? [...new Set(
        bookingNotifications
          .map(notification => notification.admin_action?.trim().toLowerCase())
          .filter(action => action && action !== 'sample_collected')
      )]
    : [];

  // Filter notifications based on active tab
  const filteredNotifications = bookingNotifications?.filter(notification => {
    const action = notification.admin_action?.trim().toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "sample_collected") return action === 'sample_collected';
    return action === activeTab;
  });

  // Helper function to get status badge
  const getStatusBadge = (admin_action: string) => {
    switch (admin_action.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
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
        return <Badge variant="outline">{admin_action}</Badge>;
    }
  };

  const handleSampleCollected = async (notificationId: string, bookingId: string) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Only admin users can update sample collection status",
      });
      return;
    }

    try {
      // Update the notification status
      const { error: notificationError } = await supabase
        .from("booking_notifications")
        .update({ 
          admin_action: 'sample_collected',
          status: 'sample_collected'
        })
        .eq("id", notificationId);

      if (notificationError) throw notificationError;

      // Update the booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: 'sample_collected' })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      toast({
        title: "Success",
        description: "Sample collection status updated",
      });

      refetchBookings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update sample collection status",
      });
    }
  };

  const handleDone = async (notificationId: string, bookingId: string) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Only admin users can mark bookings as completed",
      });
      return;
    }

    try {
      // Update the notification status
      const { error: notificationError } = await supabase
        .from("booking_notifications")
        .update({ 
          admin_action: 'completed',
          status: 'completed'
        })
        .eq("id", notificationId);

      if (notificationError) throw notificationError;

      // Update the booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: 'completed' })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      toast({
        title: "Success",
        description: "Booking marked as completed",
      });

      refetchBookings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark booking as completed",
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">
          Notifications
        </h1>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="flex flex-row w-full overflow-x-auto whitespace-nowrap gap-2">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            {/* <TabsTrigger value="sample_collected">Sample Collected</TabsTrigger> */}
            {uniqueAdminActions.map((action) => (
              <TabsTrigger key={action} value={action}>
                {action.replace(/_/g, ' ').toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {filteredNotifications?.map((notification) => (
                <Card key={notification.id} className={`${!notification.read_by_user ? 'border-blue-500' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {notification.message}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!notification.read_by_user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markBookingNotificationAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      {isAdmin && notification.admin_action.toLowerCase() === 'pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSampleCollected(notification.id, notification.booking_id)}
                        >
                          Sample Collected
                        </Button>
                      )}
                      {isAdmin && notification.admin_action.toLowerCase() === 'sample_collected' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDone(notification.id, notification.booking_id)}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(notification.admin_action)}
                        <span className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sample_collected" className="mt-6">
            <div className="space-y-4">
              {filteredNotifications
                ?.filter(notification => notification.admin_action.toLowerCase() === 'sample_collected')
                .map((notification) => (
                  <Card key={notification.id} className={`${!notification.read_by_user ? 'border-blue-500' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {notification.message}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!notification.read_by_user && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markBookingNotificationAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleDone(notification.id, notification.booking_id)}
                          >
                            Done
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(notification.admin_action)}
                          <span className="text-sm text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {uniqueAdminActions.map((action) => (
            <TabsContent key={action} value={action} className="mt-6">
              <div className="space-y-4">
                {filteredNotifications
                  ?.filter(notification => notification.admin_action.toLowerCase() === action)
                  .map((notification) => (
                    <Card key={notification.id} className={`${!notification.read_by_user ? 'border-blue-500' : ''}`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {notification.message}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {!notification.read_by_user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markBookingNotificationAsRead(notification.id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                          {isAdmin && notification.admin_action.toLowerCase() === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSampleCollected(notification.id, notification.booking_id)}
                            >
                              Sample Collected
                            </Button>
                          )}
                          {isAdmin && notification.admin_action.toLowerCase() === 'sample_collected' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDone(notification.id, notification.booking_id)}
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(notification.admin_action)}
                            <span className="text-sm text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
