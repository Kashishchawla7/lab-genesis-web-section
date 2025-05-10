
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
  read_by_user: boolean;
  created_at: string;
  updated_at: string;
}

const Notifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

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
    queryKey: ["booking-notifications"],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Fetching booking notifications for user:", user.id);
      
      const { data, error } = await supabase
        .from("booking_notifications")
        .select(`
          id,
          booking_id,
          message,
          status,
          admin_action,
          read_by_user,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching booking notifications:", error);
        throw error;
      }
      
      console.log("Fetched booking notifications:", data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("notifications")
        .insert([
          {
            title,
            message,
            is_read: false,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification sent successfully",
      });

      setTitle("");
      setMessage("");
      refetchGeneral();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send notification",
      });
    }
  };

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

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Rejected</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">
          Notifications
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="general">General Notifications</TabsTrigger>
            <TabsTrigger value="bookings">Booking Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {/* General Notifications Form and List */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Send New Notification</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Notification
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              {generalNotifications?.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg shadow-md ${
                    notification.is_read ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <Bell className={`h-5 w-5 mt-1 ${
                        notification.is_read ? "text-gray-400" : "text-blue-500"
                      }`} />
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {generalNotifications?.length === 0 && (
                <div className="text-center p-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            {/* Booking Notifications */}
            <div className="space-y-4">
              {bookingNotifications?.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`${!notification.read_by_user ? "border-l-4 border-blue-500" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">Test Booking Update</CardTitle>
                      {getStatusBadge(notification.admin_action)}
                    </div>
                    <CardDescription>
                      {new Date(notification.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(notification.updated_at).toLocaleString()}
                      </div>
                      {!notification.read_by_user && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markBookingNotificationAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {bookingNotifications?.length === 0 && (
                <div className="text-center p-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No booking notifications</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
