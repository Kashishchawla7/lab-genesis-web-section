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
        // Update package
        const { error: packageError } = await supabase
          .from("packages")
          .update({
            name: values.name,
            type_id: values.typeId,
            level_id: values.levelId,
            new_price: parseFloat(values.newPrice),
            old_price: values.oldPrice ? parseFloat(values.oldPrice) : null,
          })
          .eq("id", editingId);

        if (packageError) throw packageError;

        // Delete existing tests
        const { error: deleteError } = await supabase
          .from("tests")
          .delete()
          .eq("package_id", editingId);

        if (deleteError) throw deleteError;

        // Add new tests
        const testsToInsert = values.tests
          .filter(test => test.trim())
          .map(test => ({
            name: test,
            package_id: editingId,
            type_id: values.typeId
          }));

        if (testsToInsert.length > 0) {
          const { error: testsError } = await supabase
            .from("tests")
            .insert(testsToInsert);

          if (testsError) throw testsError;
        }

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

        console.log("Package created:", packageData);

        // Add tests
        const packageId = packageData[0].id;
        const testsToInsert = values.tests
          .filter(test => test.trim())
          .map(test => ({
            name: test,
            package_id: packageId,
            type_id: values.typeId
          }));

        console.log("Tests to insert:", testsToInsert);

        if (testsToInsert.length > 0) {
          const { data: testsData, error: testsError } = await supabase
            .from("tests")
            .insert(testsToInsert)
            .select();

          if (testsError) throw testsError;
          console.log("Tests created:", testsData);
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

  const editPackage = (pkg: Package) => {
    form.reset({
      name: pkg.name,
      typeId: pkg.type_id,
      levelId: pkg.level_id,
      newPrice: pkg.new_price.toString(),
      oldPrice: pkg.old_price ? pkg.old_price.toString() : "",
      tests: pkg.tests.map(test => test.name),
    });
    setTestInputs(pkg.tests.map(test => test.name));
    setEditingId(pkg.id);
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
    <div className="py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">
              {editingId ? "Edit Test Package" : "Add Test Package"}
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-blue-50 rounded-xl p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Package Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Fever Panel" 
                            {...field}
                            className="bg-white/70 border-blue-200 focus:border-blue-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="typeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400">
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
                          <FormLabel className="text-blue-700">Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400">
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Current Price (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter current price" 
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400"
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
                          <FormLabel className="text-blue-700">Old Price (₹) (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter old price" 
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel className="text-blue-700">Tests Included</FormLabel>
                    <div className="space-y-3">
                      {testInputs.map((test, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={test}
                            onChange={(e) => handleTestChange(index, e.target.value)}
                            placeholder={`Test ${index + 1}`}
                            className="bg-white/70 border-blue-200 focus:border-blue-400"
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeTestInput(index)}
                              className="hover:bg-red-50"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTestInput}
                      className="w-full mt-2 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Test
                    </Button>
                    {form.formState.errors.tests && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.tests.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingId ? "Update Package" : "Add Package"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Packages List */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Saved Packages</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {packages?.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-lg text-blue-900">
                            {pkg.name}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-sm">
                            {pkg.type_name && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{pkg.type_name}</span>}
                            {pkg.level_name && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">{pkg.level_name}</span>}
                          </div>
                          <div className="space-y-1">
                            {pkg.tests && pkg.tests.length > 0 ? (
                              pkg.tests.map((test, index) => (
                                <p key={index} className="text-sm text-gray-600">• {test.name}</p>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No tests added</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-blue-600">₹{pkg.new_price}</span>
                            {pkg.old_price && (
                              <span className="text-sm line-through text-gray-500">₹{pkg.old_price}</span>
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
                    </div>
                  ))}
                  
                  {!packages?.length && (
                    <div className="text-center py-8 text-gray-500">
                      No packages added yet. Create your first package using the form.
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
