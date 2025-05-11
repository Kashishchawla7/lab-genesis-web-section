
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, TestTube, FileCheck } from 'lucide-react';

const Notifications = () => {
  // Fetch all notifications without filtering by user_id
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_notifications')
        .select(`
          id,
          message,
          created_at,
          request_status,
          bookings (
            id,
            name,
            appointment_date,
            appointment_time,
            packages:test_package_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });

  // Process to mark notifications as read removed

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'sample_collected':
        return <TestTube className="h-5 w-5 text-blue-500" />;
      case 'report_generated':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'sample_collected':
        return 'Sample Collected';
      case 'report_generated':
        return 'Report Generated';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications & Test Status</h1>
        
        {notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {notification.bookings?.packages?.name || "Test Booking"}
                      </CardTitle>
                      <CardDescription>
                        Booked {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                      {getStatusIcon(notification.request_status || 'pending')}
                      <span>{getStatusText(notification.request_status || 'pending')}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold">Patient:</p>
                      <p>{notification.bookings?.name || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Appointment:</p>
                      <p>
                        {notification.bookings?.appointment_date && 
                          new Date(notification.bookings.appointment_date).toLocaleDateString()}{' '}
                        at {notification.bookings?.appointment_time || "Not specified"}
                      </p>
                    </div>
                    
                    <div className="relative pt-4">
                      <div className="flex items-center relative z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center 
                          ${notification.request_status === 'pending' || 
                            notification.request_status === 'sample_collected' || 
                            notification.request_status === 'report_generated' || 
                            notification.request_status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-sm">Booking Confirmed</p>
                        </div>
                      </div>
                      
                      <div className="ml-3 h-8 border-l-2 border-gray-200 border-dashed"></div>
                      
                      <div className="flex items-center relative z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center 
                          ${notification.request_status === 'sample_collected' || 
                            notification.request_status === 'report_generated' || 
                            notification.request_status === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                          <TestTube className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-sm">Sample Collected</p>
                        </div>
                      </div>
                      
                      <div className="ml-3 h-8 border-l-2 border-gray-200 border-dashed"></div>
                      
                      <div className="flex items-center relative z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center 
                          ${notification.request_status === 'report_generated' || 
                            notification.request_status === 'completed' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}>
                          <FileCheck className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-sm">Report Generated</p>
                        </div>
                      </div>
                      
                      <div className="ml-3 h-8 border-l-2 border-gray-200 border-dashed"></div>
                      
                      <div className="flex items-center relative z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center 
                          ${notification.request_status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-sm">Process Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-xl font-medium text-gray-700">No notifications</h3>
            <p className="text-gray-500 mt-2">You don't have any notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
