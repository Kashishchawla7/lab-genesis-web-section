import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Phone, X, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Test {
  id: string;
  name: string;
  package_id: string;
}

interface TestType {
  id: string;
  name: string;
}

interface PackageLevel {
  id: string;
  name: string;
}

interface TestCategory {
  id: string;
  name: string;
  type_id: string;
  level_id: string;
  new_price: number;
  old_price?: number;
  tests: Test[];
  test_type_mt: { name: string };
  package_level_mt: { name: string };
}

interface FilterState {
  types: string[];
  levels: string[];
}

const formSchema = z.object({
  pincode: z.string().min(6, { message: "Please enter a valid pincode." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  age: z.string().min(1, { message: "Age is required." }),
  gender: z.string({ required_error: "Please select your gender." }),
  address: z.string().min(25, { message: "Address must be at least 25 characters." }),
  testPackage: z.string({ required_error: "Please select a test package." }),
});

const BookingForm = () => {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    types: [],
    levels: []
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pincode: "",
      name: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
      address: "",
      testPackage: "",
    },
  });

  // Fetch test types
  const { data: types } = useQuery({
    queryKey: ["testTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_type_mt")
        .select("*")
        .order('name');
      
      if (error) throw error;
      return data as TestType[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
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
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const { data: categories } = useQuery({
    queryKey: ["testPackages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(`
          id,
          name,
          type_id,
          level_id,
          new_price,
          old_price,
          test_type_mt!inner(name),
          package_level_mt!inner(name),
          tests(*)
        `)
        .order('name');
      
      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        type_id: pkg.type_id,
        level_id: pkg.level_id,
        new_price: pkg.new_price,
        old_price: pkg.old_price,
        tests: pkg.tests || [],
        test_type_mt: pkg.test_type_mt,
        package_level_mt: pkg.package_level_mt
      }));
      
      return transformedData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const createBookingMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Please sign in to make a booking");
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          test_package_id: values.testPackage,
          status: 'pending',
          address: values.address,
          age: parseInt(values.age),
          gender: values.gender,
          pincode: values.pincode,
          phone: values.phone,
          email: values.email,
          name: values.name,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: new Date().toTimeString().split(' ')[0]
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "New Test Booking",
          message: `New booking for test package: ${values.testPackage}`,
          related_booking_id: bookingData.id
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

  // Handle filter selection
  const handleFilterSelection = (value: string, filterType: 'types' | 'levels') => {
    console.log('Setting filter:', filterType, value);
    setSelectedFilters(prev => {
      const currentFilters = prev[filterType];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(filter => filter !== value)
        : [...currentFilters, value];
      
      console.log(`New ${filterType} filters:`, newFilters);
      return {
        ...prev,
        [filterType]: newFilters
      };
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedFilters({
      types: [],
      levels: []
    });
  };

  // Filter packages based on selected filters
  const filteredPackages = categories?.filter(pkg => {
    debugger;
    console.log(pkg);
    const { types, levels } = selectedFilters;
    const matchesType = types.length === 0 || (pkg.test_type_mt?.name && types.includes(pkg.test_type_mt.name));
    const matchesLevel = levels.length === 0 || (pkg.package_level_mt?.name && levels.includes(pkg.package_level_mt.name));
  
    // If both filters are selected, match both
    if (types.length > 0 && levels.length > 0) {
      return types.includes(pkg.test_type_mt?.name || '') && levels.includes(pkg.package_level_mt?.name || '');
    }
  
    // If only one filter is selected, match either
    return matchesType && matchesLevel;
  });
  

  console.log('Filtered packages:', filteredPackages.map(pkg => pkg.name));

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300; // Adjust this value based on your card width
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#004236] via-[#004236] to-[#006236]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start py-8">
          {/* Left Column - Test Packages */}
          <div className="lg:w-1/2">
            {/* Hero Section */}
            <div className="text-white mb-8">
              <h1 className="text-5xl font-bold mb-2 tracking-wide">
                MAKE IT YOUR RIGHT<br />
                TO HAVE A HEALTHY LIFE
              </h1>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mt-4">
                <Phone className="h-6 w-6" />
                <span className="text-2xl font-semibold">9944320934</span>
              </div>
            </div>

            {/* Package Cards */}
            <div className="relative mb-8">
              <div className="grid grid-cols-2 gap-6">
                {filteredPackages
                  ?.sort((a, b) => (b.tests?.length || 0) - (a.tests?.length || 0))
                  .slice(0, 4)
                  .map((pkg) => (
                  <div
                    key={pkg.id}
                    className={cn(
                      "bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]",
                      form.getValues("testPackage") === pkg.id && "ring-2 ring-[#004236]"
                    )}
                    onClick={() => form.setValue("testPackage", pkg.id)}
                  >
                    <div className="bg-gradient-to-r from-[#004236] to-[#006236] text-white p-4">
                      <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                          {pkg.tests?.length || 0} Tests
                        </span>
                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                          {pkg.test_type_mt?.name}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[#004236]">₹{pkg.new_price}</span>
                        {pkg.old_price && (
                          <span className="text-gray-400 line-through text-lg">₹{pkg.old_price}</span>
                        )}
                      </div>
                      {pkg.old_price && (
                        <div className="mt-1 text-sm text-green-600 font-medium">
                          Save ₹{pkg.old_price - pkg.new_price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

           

            {/* Important Notes */}
            <div className="text-white/80 text-sm flex flex-row items-center justify-start gap-4">
              <p className="flex items-center gap-1">
                <span className="text-red-400">*</span>
                10-12 hrs fasting is essential
              </p>
              <p className="flex items-center gap-1">
                <span className="text-red-400">*</span>
                offer valid for limited period only
              </p>
              <p className="flex items-center gap-1">
                <span className="text-red-400">#</span>
                eGFR applicable above 18 years of age
              </p>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[#004236]">Book Your Test Now</h2>
                <p className="text-gray-600 mt-1">Fill Out The Form</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="testPackage"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]">
                              <SelectValue placeholder="Select Test Package*" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {filteredPackages?.map((pkg) => (
                              <SelectItem 
                                key={pkg.id} 
                                value={pkg.id}
                                className="focus:bg-gray-100 cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{pkg.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">
                                      {pkg.tests?.length || 0} Tests
                                    </span>
                                    <span className="text-sm text-blue-600 font-medium">
                                      ₹{pkg.new_price}
                                    </span>
                                    {pkg.old_price && (
                                      <span className="text-sm text-gray-400 line-through">
                                        ₹{pkg.old_price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Enter Pin Code*" 
                            {...field}
                            className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]" 
                          />
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
                          <Input 
                            placeholder="Enter Name*" 
                            {...field}
                            className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Enter Mobile No*" 
                            {...field}
                            className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]" 
                          />
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
                          <Input 
                            placeholder="Email*" 
                            {...field}
                            className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Age*" 
                              {...field}
                              className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]" 
                            />
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
                              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-[#004236]">
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
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            {pkg.tests?.length || 0} Tests
                          </span>
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

<style jsx global>{`
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>
