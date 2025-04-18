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
import { Textarea } from "@/components/ui/textarea";
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
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X } from "lucide-react";

const testSchema = z.object({
  name: z.string().min(2, "Package name must be at least 2 characters"),
  type: z.enum(["fever", "health"]),
  level: z.enum(["basic", "advance", "essential", "master"]),
  price: z.string().min(1, "Price is required"),
  tests: z.array(z.string()).min(1, "At least one test is required"),
});

interface DatabaseTestPackage {
  id: string;
  name: string;
  type: "fever" | "health";
  level: "basic" | "advance" | "essential" | "master";
  price: number;
  tests: string[];
  created_at?: string;
  updated_at?: string;
}

interface TestPackage {
  id?: string;
  name: string;
  type: "fever" | "health";
  level: "basic" | "advance" | "essential" | "master";
  price: string;
  tests: string[];
}

const TestCategoryForm = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testInputs, setTestInputs] = useState<string[]>(['']);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: "",
      type: "fever",
      level: "basic",
      price: "",
      tests: [''],
    },
  });

  const { data: packages, refetch } = useQuery({
    queryKey: ["testPackages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_packages")
        .select("*")
        .order('type')
        .order('level');
      
      if (error) throw error;
      return (data as DatabaseTestPackage[]).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        type: pkg.type,
        level: pkg.level,
        price: pkg.price.toString(),
        tests: pkg.tests
      }));
    },
  });

  const onSubmit = async (values: z.infer<typeof testSchema>) => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from("test_packages")
          .update({
            name: values.name,
            type: values.type,
            level: values.level,
            price: parseFloat(values.price),
            tests: values.tests,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Package updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("test_packages")
          .insert({
            name: values.name,
            type: values.type,
            level: values.level,
            price: parseFloat(values.price),
            tests: values.tests,
          } as DatabaseTestPackage);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Package created successfully",
        });
      }
      
      form.reset();
      setEditingId(null);
      refetch();
    } catch (error) {
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

  const editPackage = (pkg: TestPackage) => {
    form.reset({
      name: pkg.name,
      type: pkg.type,
      level: pkg.level,
      price: pkg.price,
      tests: pkg.tests,
    });
    setTestInputs(pkg.tests);
    setEditingId(pkg.id);
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("test_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete package",
      });
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'basic': return '1. Basic';
      case 'advance': return '2. Advance';
      case 'essential': return '3. Essential';
      case 'master': return '4. Master';
      default: return level;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fever">Fever Panel</SelectItem>
                              <SelectItem value="health">Health Checkup</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-blue-200 focus:border-blue-400">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">1. Basic</SelectItem>
                              <SelectItem value="advance">2. Advance</SelectItem>
                              <SelectItem value="essential">3. Essential</SelectItem>
                              <SelectItem value="master">4. Master</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter price" 
                            {...field}
                            className="bg-white/70 border-blue-200 focus:border-blue-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              {/* Fever Panels */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Fever Panels</h3>
                <div className="space-y-4">
                  {packages?.filter(p => p.type === 'fever').map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-lg text-blue-900">
                            {getLevelLabel(pkg.level)} {pkg.name}
                          </h4>
                          <div className="space-y-1">
                            {pkg.tests.map((test, index) => (
                              <p key={index} className="text-sm text-gray-600">• {test}</p>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-blue-600">₹{pkg.price}/-</span>
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
                </div>
              </div>

              {/* Health Checkups */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Health Checkups</h3>
                <div className="space-y-4">
                  {packages?.filter(p => p.type === 'health').map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-medium text-lg text-blue-900">
                            {getLevelLabel(pkg.level)} {pkg.name}
                          </h4>
                          <div className="space-y-1">
                            {pkg.tests.map((test, index) => (
                              <p key={index} className="text-sm text-gray-600">• {test}</p>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-blue-600">₹{pkg.price}/-</span>
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