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
        .order('name');
      
      if (error) throw error;
      return data as TestType[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch package levels
  const { data: levels } = useQuery({
    queryKey: ["packageLevels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_level_mt")
        .select("*")
        .order('name');
      
      if (error) throw error;
      return data as PackageLevel[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { data: categories } = useQuery({
    queryKey: ["testPackages"],
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

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Address (atleast 25 characters)*" 
                            {...field} 
                            className="min-h-[100px] bg-gray-50 border-gray-200 focus:border-[#004236]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-[#004236] hover:bg-[#003226] text-white h-12 text-lg font-semibold" 
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Booking..." : "Book Now"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
</div>

 {/* Filter Section and Test Cards */}
 <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Column */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                  <div className="flex items-center gap-2">
                    {(selectedFilters.types.length > 0 || selectedFilters.levels.length > 0) && (
                      <button
                        onClick={resetFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedCategory('filters')}
                      className="lg:hidden text-blue-600 hover:text-blue-700"
                    >
                      {expandedCategory === 'filters' ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className={cn(
                  "space-y-6 transition-all duration-300",
                  expandedCategory === 'filters' ? "block" : "hidden lg:block"
                )}>
                  {/* Test Types Filter */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Test Types
                      {selectedFilters.types.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {selectedFilters.types.length} selected
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {types?.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleFilterSelection(type.name, 'types')}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedFilters.types.includes(type.name)
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                          )}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Package Levels Filter */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600 flex items-center justify-between">
                      Package Levels
                      {selectedFilters.levels.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {selectedFilters.levels.length} selected
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {levels?.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => handleFilterSelection(level.name, 'levels')}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedFilters.levels.includes(level.name)
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                          )}
                        >
                          {level.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Cards Grid */}
          <div className="lg:w-3/4">
            <div className="relative">
              <div 
                className="flex gap-6 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {filteredPackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className={cn(
                      "bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group min-w-[300px] flex-shrink-0",
                      index < 3 ? "flex-shrink-0" : "flex-shrink-0 transform translate-x-0 transition-transform duration-300"
                    )}
                  >
                    <div className="p-6 space-y-4">
                      {/* Header with Name and Badges */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-xl text-[#004236] group-hover:text-blue-600 transition-colors">
                            {pkg.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pkg.test_type_mt?.name && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {pkg.test_type_mt.name}
                            </span>
                          )}
                          {pkg.package_level_mt?.name && (
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium inline-flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              {pkg.package_level_mt.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-blue-600">₹{pkg.new_price}/-</span>
                          {pkg.old_price && (
                            <span className="text-lg line-through text-gray-400 relative">
                              <span className="absolute inset-0 h-[2px] bg-red-400 top-1/2 -rotate-12"></span>
                              ₹{pkg.old_price}/-
                            </span>
                          )}
                        </div>
                        {pkg.old_price && (
                          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Save ₹{pkg.old_price - pkg.new_price}/-
                          </span>
                        )}
                      </div>

                      {/* Test Preview Tiles */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Included Tests:</span>
                          <Button
                            variant="ghost"
                            onClick={() => setExpandedCategory(
                              expandedCategory === pkg.id ? null : pkg.id
                            )}
                            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                          >
                            {expandedCategory === pkg.id ? 'View Less' : 'View All'}
                          </Button>
                        </div>
                        <div className={cn(
                          "grid grid-cols-1 gap-2 transition-all duration-300",
                          expandedCategory === pkg.id ? "overflow-y-auto max-h-[200px]" : "overflow-hidden max-h-[200px]"
                        )}>
                          {pkg.tests?.map((test) => (
                            <div
                              key={test.id}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm text-gray-700 font-medium line-clamp-2">
                                  {test.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {pkg.tests?.length === 0 && (
                          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500 font-medium">No tests added yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredPackages.length > 3 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -left-5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50 h-9 w-9 border-gray-200 z-10"
                    onClick={() => {
                      const container = document.querySelector('.scroll-smooth');
                      if (container) {
                        container.scrollBy({ left: -320, behavior: 'smooth' });
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -right-5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50 h-9 w-9 border-gray-200 z-10"
                    onClick={() => {
                      const container = document.querySelector('.scroll-smooth');
                      if (container) {
                        container.scrollBy({ left: 320, behavior: 'smooth' });
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 5.293a1 1 0 011.414 0L12 8.586l-3.293 3.293a1 1 0 11-1.414-1.414l4-4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
};

export default BookingForm;
