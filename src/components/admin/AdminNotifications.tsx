
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BookingNotification {
  id: string;
  booking_id: string;
  user_id: string;
  message: string;
  status: string;
  admin_action: string;
  read_by_admin: boolean;
  read_by_user: boolean;
  created_at: string;
  updated_at: string;
}

const AdminNotifications = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [selectedNotification, setSelectedNotification] = useState<BookingNotification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query for booking notifications
  const { data: notifications, refetch } = useQuery({
    queryKey: ["admin-booking-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_notifications")
        .select(`
          *,
          bookings(
            user_id,
            name,
            phone,
            email,
            age,
            gender,
            address,
            test_package_id,
            appointment_date,
            appointment_time,
            test_packages(name)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (BookingNotification & { 
        bookings: {
          user_id: string;
          name: string;
          phone: string;
          email: string;
          age: number;
          gender: string;
          address: string;
          test_package_id: string;
          appointment_date: string;
          appointment_time: string;
          test_packages: { name: string };
        } 
      })[];
    },
  });

  // Set up real-time subscription for booking notifications
  useEffect(() => {
    const channel = supabase
      .channel('admin-booking-notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_notifications' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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

  const updateStatus = async (id: string, booking_id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("booking_notifications")
        .update({ 
          admin_action: status,
          read_by_admin: true, 
          message: notesMap[id] 
            ? `Your booking has been ${status.toLowerCase()}. Note: ${notesMap[id]}` 
            : `Your booking has been ${status.toLowerCase()}.`
        })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Booking status has been updated to ${status}`,
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const handleNoteChange = (id: string, note: string) => {
    setNotesMap(prev => ({
      ...prev,
      [id]: note
    }));
  };

  const filterNotifications = () => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      // Status filter
      if (statusFilter !== "all" && notification.admin_action.toLowerCase() !== statusFilter) {
        return false;
      }
      
      // Search filter - check booking details
      if (searchTerm && !notification.bookings.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !notification.bookings.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !notification.bookings.test_packages.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // View notification details
  const viewNotificationDetails = (notification: BookingNotification & { 
    bookings: {
      user_id: string;
      name: string;
      phone: string;
      email: string;
      age: number;
      gender: string;
      address: string;
      test_package_id: string;
      appointment_date: string;
      appointment_time: string;
      test_packages: { name: string };
    } 
  }) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
  };

  const filteredNotifications = filterNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by name, email or test"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${!notification.read_by_admin ? "border-l-4 border-blue-500" : ""}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Booking Request: {notification.bookings.test_packages.name}
                    {!notification.read_by_admin && (
                      <Badge variant="blue" className="bg-blue-500">New</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {notification.bookings.name} • {notification.bookings.email} • {notification.bookings.phone}
                  </CardDescription>
                </div>
                {getStatusBadge(notification.admin_action)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Appointment</p>
                  <p>
                    {new Date(notification.bookings.appointment_date).toLocaleDateString()} • {notification.bookings.appointment_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User Details</p>
                  <p>
                    {notification.bookings.age} years • {notification.bookings.gender}
                  </p>
                </div>
              </div>
              
              <Textarea
                placeholder="Add notes for the user (optional)"
                value={notesMap[notification.id] || ""}
                onChange={(e) => handleNoteChange(notification.id, e.target.value)}
                className="mb-4"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewNotificationDetails(notification)}
                >
                  View Details
                </Button>
                {!notification.read_by_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="success"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatus(notification.id, notification.booking_id, "approved")}
                  disabled={notification.admin_action.toLowerCase() === "approved"}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateStatus(notification.id, notification.booking_id, "rejected")}
                  disabled={notification.admin_action.toLowerCase() === "rejected"}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatus(notification.id, notification.booking_id, "in_progress")}
                  disabled={notification.admin_action.toLowerCase() === "in_progress"}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  In Progress
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        )}
      </div>

      {/* Notification Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View complete information about this test booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Patient Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Name:</span>
                    <span className="col-span-2">{selectedNotification.bookings.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Email:</span>
                    <span className="col-span-2">{selectedNotification.bookings.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Phone:</span>
                    <span className="col-span-2">{selectedNotification.bookings.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Age:</span>
                    <span className="col-span-2">{selectedNotification.bookings.age} years</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Gender:</span>
                    <span className="col-span-2">{selectedNotification.bookings.gender}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Booking Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Test:</span>
                    <span className="col-span-2">{selectedNotification.bookings.test_packages.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Date:</span>
                    <span className="col-span-2">{new Date(selectedNotification.bookings.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Time:</span>
                    <span className="col-span-2">{selectedNotification.bookings.appointment_time}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Status:</span>
                    <span className="col-span-2">{getStatusBadge(selectedNotification.admin_action)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="col-span-2">{new Date(selectedNotification.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <h3 className="font-medium mb-2">Address</h3>
                <p className="text-gray-700">{selectedNotification.bookings.address}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
