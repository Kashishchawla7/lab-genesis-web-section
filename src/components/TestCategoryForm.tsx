import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X } from "lucide-react";

const packageSchema = z.object({
  name: z.string().min(2, "Package name must be at least 2 characters"),
  typeId: z.string().min(1, "Type is required"),
  levelId: z.string().min(1, "Level is required"),
  newPrice: z.string().min(1, "Price is required"),
  oldPrice: z.string().optional(),
  tests: z.array(z.string()).min(1, "At least one test is required"),
});

interface PackageForm {
  id?: string;
  name: string;
  typeId: string;
  levelId: string;
  newPrice: string;
  oldPrice?: string;
  tests: string[];
}

interface Package {
  id: string;
  name: string;
  type_id: string;
  level_id: string;
  new_price: number;
  old_price?: number;
  tests: Test[];
  type_name?: string;
  level_name?: string;
}

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

const TestCategoryForm = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testInputs, setTestInputs] = useState<string[]>(['']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      typeId: "",
      levelId: "",
      newPrice: "",
      oldPrice: "",
      tests: [''],
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
  });

  // Fetch packages with type and level names
  const { data: packages, refetch } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          type:test_type_mt(name),
          level:package_level_mt(name)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Fetch tests for each package
      const packagesWithTests = await Promise.all(
        data.map(async (pkg) => {
          const { data: testsData, error: testsError } = await supabase
            .from("tests")
            .select("*")
            .eq("package_id", pkg.id);
          
          if (testsError) throw testsError;
          
          return {
            ...pkg,
            type_name: pkg.type?.name,
            level_name: pkg.level?.name,
            tests: testsData || []
          };
        })
      );
      
      return packagesWithTests as Package[];
    },
  });

  const onSubmit = async (values: z.infer<typeof packageSchema>) => {
    try {
      console.log("Submitting form values:", values);
      
      if (editingId) {
        // Start a transaction to ensure atomic operations
        const { error: transactionError } = await supabase.rpc('update_package', {
          p_package_id: editingId,
          p_name: values.name,
          p_type_id: values.typeId,
          p_level_id: values.levelId,
          p_new_price: parseFloat(values.newPrice),
          p_old_price: values.oldPrice ? parseFloat(values.oldPrice) : null,
          p_tests: values.tests.filter(test => test.trim())
        });

        if (transactionError) throw transactionError;

        toast({
          title: "Success",
          description: "Package updated successfully",
        });
      } else {
        // Insert new package
        const { data: packageData, error: packageError } = await supabase
          .from("packages")
          .insert({
            name: values.name,
            type_id: values.typeId,
            level_id: values.levelId,
            new_price: parseFloat(values.newPrice),
            old_price: values.oldPrice ? parseFloat(values.oldPrice) : null,
          })
          .select();

        if (packageError) throw packageError;

        // Add tests
        const packageId = packageData[0].id;
        const testsToInsert = values.tests
          .filter(test => test.trim())
          .map(test => ({
            name: test,
            package_id: packageId
          }));

        if (testsToInsert.length > 0) {
          const { error: testsError } = await supabase
            .from("tests")
            .insert(testsToInsert);

          if (testsError) throw testsError;
        }

        toast({
          title: "Success",
          description: "Package created successfully",
        });
      }
      
      form.reset();
      setEditingId(null);
      setTestInputs(['']);
      queryClient.invalidateQueries({queryKey: ["packages"]});
      queryClient.invalidateQueries({queryKey: ["testPackages"]});
      refetch();
    } catch (error) {
      console.error("Error saving package:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save package",
      });
    }
  };

  const addTestInput = () => {
    setTestInputs([...testInputs, '']);
    form.setValue('tests', [...form.getValues('tests'), '']);
  };

  const removeTestInput = (index: number) => {
    const newTests = testInputs.filter((_, i) => i !== index);
    setTestInputs(newTests);
    form.setValue('tests', newTests);
  };

  const handleTestChange = (index: number, value: string) => {
    const newTests = [...testInputs];
    newTests[index] = value;
    setTestInputs(newTests);
    form.setValue('tests', newTests);
  };

  const editPackage = async (pkg: Package) => {
    try {
      // Fetch the complete package data with its tests
      const { data: packageData, error: fetchError } = await supabase
        .from("packages")
        .select(`
          *,
          type:test_type_mt(name),
          level:package_level_mt(name),
          tests(*)
        `)
        .eq('id', pkg.id)
        .single();

      if (fetchError) throw fetchError;

      // Reset form with the fetched data
      form.reset({
        name: packageData.name,
        typeId: packageData.type_id,
        levelId: packageData.level_id,
        newPrice: packageData.new_price.toString(),
        oldPrice: packageData.old_price ? packageData.old_price.toString() : "",
        tests: packageData.tests.map(test => test.name),
      });

      // Update test inputs
      setTestInputs(packageData.tests.map(test => test.name));
      
      // Set editing ID
      setEditingId(packageData.id);

    } catch (error) {
      console.error("Error preparing package for edit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prepare package for editing",
      });
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      queryClient.invalidateQueries({queryKey: ["packages"]});
      queryClient.invalidateQueries({queryKey: ["testPackages"]});
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete package",
      });
    }
  };

  return (
    <div className="py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-600 mb-4 flex items-center justify-center">
              <span className="bg-blue-600 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </span>
              {editingId ? "Edit Test Package" : "Add Test Package"}
      </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-lg border border-blue-100">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
                    control={form.control}
                    name="name"
            render={({ field }) => (
              <FormItem>
                        <FormLabel className="text-blue-700 font-medium">Package Name</FormLabel>
                <FormControl>
                          <Input 
                            placeholder="e.g., Fever Panel" 
                            {...field}
                            className="bg-white/70 border-blue-200 focus:border-blue-400 h-11"
                          />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

                  <div className="grid grid-cols-2 gap-6">
          <FormField
                      control={form.control}
                      name="typeId"
            render={({ field }) => (
              <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400 h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                </FormControl>
                            <SelectContent>
                              {types?.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
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
                      name="levelId"
            render={({ field }) => (
              <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400 h-11">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                </FormControl>
                            <SelectContent>
                              {levels?.map(level => (
                                <SelectItem key={level.id} value={level.id}>
                                  {level.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                <FormMessage />
              </FormItem>
            )}
          />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
          <FormField
                      control={form.control}
                      name="newPrice"
            render={({ field }) => (
              <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Current Price (₹)</FormLabel>
                <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter current price" 
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400 h-11"
                            />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
                      control={form.control}
                      name="oldPrice"
            render={({ field }) => (
              <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Old Price (₹) (Optional)</FormLabel>
                <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter old price" 
                    {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400 h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
                  </div>

        <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-blue-700 font-medium">Tests Included</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTestInput}
                        className="border-blue-200 hover:bg-blue-50 h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Test
                      </Button>
              </div>
                    <div className="space-y-3 bg-white/80 rounded-lg p-4 border border-blue-100">
                      {testInputs.map((test, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={test}
                            onChange={(e) => handleTestChange(index, e.target.value)}
                            placeholder={`Test ${index + 1}`}
                            className="bg-white/70 border-blue-200 focus:border-blue-400 h-11"
                          />
                          {index > 0 && (
                <Button
                              type="button"
                  variant="outline"
                  size="icon"
                              onClick={() => removeTestInput(index)}
                              className="hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                              <X className="h-4 w-4 text-red-500" />
                </Button>
                          )}
            </div>
          ))}
        </div>
                    {form.formState.errors.tests && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.tests.message}
                      </p>
      )}
                  </div>

        <Button
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
        >
                    {editingId ? "Update Package" : "Add Package"}
        </Button>
                </form>
              </Form>
            </div>

            {/* Packages List */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-blue-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Saved Packages
                  </h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {packages?.length || 0} Packages
                  </span>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                  {packages?.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-200"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg text-blue-900">
                              {pkg.name}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {pkg.type_name && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                  {pkg.type_name}
                                </span>
                              )}
                              {pkg.level_name && (
                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium inline-flex items-center">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                                  {pkg.level_name}
                                </span>
                              )}
                            </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                              onClick={() => editPackage(pkg)}
                              className="hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                              onClick={() => pkg.id && deletePackage(pkg.id)}
                              className="hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="mb-2 text-sm font-medium text-gray-700 flex items-center justify-between">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Tests Included
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {pkg.tests?.length || 0} Tests
                            </span>
                          </div>
                          <div className="relative">
                            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                              {pkg.tests && pkg.tests.length > 0 ? (
                                pkg.tests.map((test, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-600 break-words">{test.name}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic col-span-2">No tests added</p>
                              )}
                            </div>
                            {(pkg.tests?.length || 0) > 6 && (
                              <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-blue-600">₹{pkg.new_price}</span>
                            {pkg.old_price && (
                              <>
                                <span className="text-sm line-through text-gray-500">₹{pkg.old_price}</span>
                                <span className="text-sm font-medium text-green-600">
                                  Save ₹{pkg.old_price - pkg.new_price}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!packages?.length && (
                    <div className="text-center py-12 bg-white rounded-xl border border-blue-100">
                      <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">No Packages Added Yet</h4>
                      <p className="text-gray-500">Create your first package using the form.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCategoryForm; 
