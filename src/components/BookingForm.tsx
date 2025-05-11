import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  testPackageId: z.string().min(1, {
    message: "Please select a test package.",
  }),
  appointmentDate: z.date({
    required_error: "Please select a date.",
  }),
  appointmentTime: z.string().min(1, {
    message: "Please select a time.",
  }),
  printedReport: z.boolean().default(false),
  contactSms: z.boolean().default(false),
  contactCall: z.boolean().default(false),
  contactEmail: z.boolean().default(false),
  contactWhatsapp: z.boolean().default(false),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  phone: z.string().regex(/^(\+?\d{1,4}[- ]?)?\d{10}$/, {
    message: "Please enter a valid 10-digit phone number.",
  }),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, {
    message: "Please enter a valid 6-digit pincode.",
  }),
  address: z.string().min(10, {
    message: "Address must be at least 10 characters.",
  }),
  age: z.number().min(1, {
    message: "Age must be at least 1.",
  }).max(150, {
    message: "Age must be less than 150.",
  }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: "Please select a gender.",
  }),
});

const BookingForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testPackageId: "",
      appointmentDate: new Date(),
      appointmentTime: "",
      printedReport: false,
      contactSms: false,
      contactCall: false,
      contactEmail: false,
      contactWhatsapp: false,
      name: "",
      email: "",
      phone: "",
      pincode: "",
      address: "",
      age: 18,
      gender: 'male',
    },
  });

  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching packages:", error);
        return [];
      }
      return data || [];
    },
  });

  const submitHandler = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          test_package_id: values.testPackageId,
          appointment_date: values.appointmentDate,
          appointment_time: values.appointmentTime,
          printed_report: values.printedReport,
          contact_preferences: {
            sms: values.contactSms,
            call: values.contactCall,
            email: values.contactEmail,
            whatsapp: values.contactWhatsapp,
          },
          name: values.name,
          email: values.email,
          phone: values.phone,
          pincode: values.pincode,
          address: values.address,
          age: values.age,
          gender: values.gender,
        })
        .select();

      if (bookingError) throw bookingError;

      const { data: packageData } = await supabase
        .from("packages")
        .select("name")
        .eq("id", values.testPackageId)
        .single();

      const packageName = packageData?.name || "Unknown Package";

      if (bookingData && bookingData.length > 0) {
        const { error: notifError } = await supabase
          .from("booking_notifications")
          .insert({
            booking_id: bookingData[0].id,
            message: `Test booked: ${packageName}`,
            status: "pending",
            request_status: "pending",
          });

        if (notifError) throw notifError;
      }

      toast({
        title: "Booking Successful",
        description: "Your test has been booked successfully.",
      });

      reset();
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem with your submission. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const { reset } = form;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-8">
        <FormField
          control={form.control}
          name="testPackageId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Package</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test package" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingPackages ? (
                    <SelectItem value="" disabled>Loading packages...</SelectItem>
                  ) : (
                    packages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the test package you want to book.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Appointment Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3.5 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the date for your appointment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Appointment Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">01:00 PM</SelectItem>
                    <SelectItem value="14:00">02:00 PM</SelectItem>
                    <SelectItem value="15:00">03:00 PM</SelectItem>
                    <SelectItem value="16:00">04:00 PM</SelectItem>
                    <SelectItem value="17:00">05:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the time for your appointment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="printedReport"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Printed Report</FormLabel>
                <FormDescription>
                  Do you want a printed copy of your report?
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Contact Preferences</FormLabel>
          <div className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="contactSms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center rounded-lg border p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 ml-4">
                    <FormLabel className="text-base">SMS</FormLabel>
                    <FormDescription>
                      Receive updates via SMS.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactCall"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center rounded-lg border p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 ml-4">
                    <FormLabel className="text-base">Call</FormLabel>
                    <FormDescription>
                      Receive updates via Call.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center rounded-lg border p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 ml-4">
                    <FormLabel className="text-base">Email</FormLabel>
                    <FormDescription>
                      Receive updates via Email.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactWhatsapp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center rounded-lg border p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 ml-4">
                    <FormLabel className="text-base">WhatsApp</FormLabel>
                    <FormDescription>
                      Receive updates via WhatsApp.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormDescription>
                Enter the name of the patient.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" type="email" {...field} />
              </FormControl>
              <FormDescription>
                Enter the email of the patient.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" type="tel" {...field} />
              </FormControl>
              <FormDescription>
                Enter the phone number of the patient.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode</FormLabel>
              <FormControl>
                <Input placeholder="Enter your pincode" {...field} />
              </FormControl>
              <FormDescription>
                Enter the pincode of the address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your address"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the address of the patient.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input placeholder="Enter age" type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the age of the patient.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the gender of the patient.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Book Now"}
        </Button>
      </form>
    </Form>
  );
};

export default BookingForm;
