import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Test {
  id?: string;
  testName: string;
  oldPrice: string;
  newPrice: string;
  description: string;
  categoryId?: string;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  price: number;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  age: z.string().min(1, { message: "Age is required." }),
  gender: z.string({ required_error: "Please select your gender." }),
  address: z.string().min(25, { message: "Address must be at least 25 characters." }),
  testPackage: z.string({ required_error: "Please select a test package." }),
  appointmentDate: z.date({ required_error: "Please select a date." }),
  timeSlot: z.string({ required_error: "Please select a time slot." }),
  printedReport: z.boolean().default(false),
  contactPreferences: z.object({
    whatsapp: z.boolean().default(false),
    call: z.boolean().default(false),
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
  }),
  pincode: z.string().min(6, { message: "Please enter a valid pin code." }),
  iAuthorize: z.boolean().refine((value) => value === true, {
    message: 'Please authorize us to contact you.',
  }),
});

const BookingForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printedReport: false,
      contactPreferences: {
        whatsapp: false,
        call: false,
        email: false,
        sms: false,
      },
      iAuthorize: false,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["testPackages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_packages")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          test_package_id: values.testPackage,
          status: 'pending',
          appointment_date: values.appointmentDate.toISOString(),
          appointment_time: values.timeSlot,
          name: values.name,
          email: values.email,
          phone: values.phone,
          age: parseInt(values.age, 10),
          gender: values.gender,
          address: values.address,
          pincode: values.pincode, // Using pin code from the form
          printed_report: values.printedReport,
          contact_preferences: values.contactPreferences
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // Create notification for the admin
      const { error: notificationError } = await supabase
        .from("booking_notifications")
        .insert({
          user_id: user.id,
          booking_id: bookingData.id,
          message: `New test booking for package: ${values.testPackage}`,
          status: 'pending',
          admin_action: 'pending'
        });

      if (notificationError) {
        throw notificationError;
      }

      return bookingData;
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Successful",
        description: "Your test booking has been created. An admin will review it shortly.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createBookingMutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 space-y-6">
            <div className="bg-gradient-to-r from-[#004236] to-[#006236] text-white p-8 rounded-2xl shadow-xl backdrop-blur-sm">
              <h1 className="text-3xl font-bold mb-4">
                MAKE IT YOUR RIGHT<br />
                TO HAVE A HEALTHY LIFE
              </h1>
              <div className="flex items-center gap-2 text-xl">
                <Phone className="h-6 w-6" />
                <span>+91 9355502226</span>
              </div>
            </div>

            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <div className="grid gap-4">
                {categories.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => form.setValue("testPackage", pkg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg text-gray-500 line-through">₹7014/-</p>
                          <div className="bg-pink-50 rounded-lg px-3 py-1 text-pink-600 text-sm font-medium">
                            78% off
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">₹{pkg.price}/-</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>for a limited period</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-700 bg-white/80 backdrop-blur-sm p-4 rounded-lg">
                <p>*10-12 hrs fasting is essential</p>
                <p>*offer valid for limited period only</p>
                <p>#eGFR applicable above 18 years of age</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-bold text-center text-[#004236] mb-4">Book Your Test Now</h2>
              <div className="w-24 h-1 bg-[#004236] mx-auto rounded-full mb-6"></div>
              <p className="text-center text-gray-600 mb-8">Fill Out The Form</p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Input placeholder="Enter Pin Code*" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter Name*" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter Mobile No*" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Email*" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Age*" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Gender*" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Address (atleast 25 characters)*" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select Appointment Date*</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                              <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="printedReport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Additional Rs. 75 for Printed Reports</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reach me on:</p>
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="contactPreferences.whatsapp"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Whatsapp</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPreferences.call"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Call</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPreferences.email"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Email</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPreferences.sms"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">SMS</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="iAuthorize"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I authorize Thyrocare representative to contact me.I understand that this will override the DND status on my mobile number.*
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Booking..." : "Book Test"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
