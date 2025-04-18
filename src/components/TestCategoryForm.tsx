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
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";

const testSchema = z.object({
  testName: z.string().min(2, "Test name must be at least 2 characters"),
  oldPrice: z.string().min(1, "Old price is required"),
  newPrice: z.string().min(1, "New price is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const categorySchema = z.object({
  categoryName: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

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
}

const TestCategoryForm = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["testMainCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_categories")
        .select("*");
      
      if (error) throw error;
      return data as TestCategory[];
    },
  });

  const { data: testItems, refetch: refetchTestItems } = useQuery({
    queryKey: ["testItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_items")
        .select("*");
      
      if (error) throw error;
      return (data as unknown as Test[]) || [];
    },
  });

  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testName: "",
      oldPrice: "",
      newPrice: "",
      description: "",
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: "",
      description: "",
    },
  });

  const onTestSubmit = (values: z.infer<typeof testSchema>) => {
    if (editingTestIndex !== null) {
      const updatedTests = [...tests];
      updatedTests[editingTestIndex] = values;
      setTests(updatedTests);
      setEditingTestIndex(null);
    } else {
      setTests([...tests, values]);
    }
    testForm.reset();
    toast({
      title: "Success",
      description: editingTestIndex !== null 
        ? "Test updated successfully" 
        : "Test added successfully",
    });
  };

  const onCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      if (editingCategoryId) {
        // Update existing category
        const { error } = await supabase
          .from("test_categories")
          .update({
            name: values.categoryName,
            description: values.description,
          })
          .eq("id", editingCategoryId);

        if (error) throw error;

        // Update test items
        for (const test of tests) {
          if (test.id) {
            // Update existing test
            const { error: testError } = await supabase
              .from("test_items")
              .update({
                testName: test.testName,
                oldPrice: test.oldPrice,
                newPrice: test.newPrice,
                description: test.description,
              })
              .eq("id", test.id);

            if (testError) throw testError;
          } else {
            // Insert new test
            const { error: testError } = await supabase
              .from("test_items")
              .insert({
                testName: test.testName,
                oldPrice: test.oldPrice,
                newPrice: test.newPrice,
                description: test.description,
                categoryId: editingCategoryId,
              });

            if (testError) throw testError;
          }
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        const { data: category, error: categoryError } = await supabase
          .from("test_categories")
          .insert({
            name: values.categoryName,
            description: values.description,
          })
          .select()
          .single();

        if (categoryError) throw categoryError;

        // Insert test items
        for (const test of tests) {
          const { error: testError } = await supabase
            .from("test_items")
            .insert({
              testName: test.testName,
              oldPrice: test.oldPrice,
              newPrice: test.newPrice,
              description: test.description,
              categoryId: category.id,
            });

          if (testError) throw testError;
        }

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      
      // Reset forms
      categoryForm.reset();
      setTests([]);
      setEditingCategoryId(null);
      refetchCategories();
      refetchTestItems();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save category",
      });
    }
  };

  const editCategory = async (category: TestCategory) => {
    categoryForm.reset({
      categoryName: category.name,
      description: category.description,
    });
    
    // Fetch test items for this category
    const { data: categoryTests, error } = await supabase
      .from("test_items")
      .select("*")
      .eq("categoryId", category.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch test items",
      });
      return;
    }

    setTests(categoryTests || []);
    setEditingCategoryId(category.id);
  };

  const deleteCategory = async (id: string) => {
    try {
      // First delete all test items for this category
      const { error: testError } = await supabase
        .from("test_items")
        .delete()
        .eq("categoryId", id);

      if (testError) throw testError;

      // Then delete the category
      const { error: categoryError } = await supabase
        .from("test_categories")
        .delete()
        .eq("id", id);

      if (categoryError) throw categoryError;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      refetchCategories();
      refetchTestItems();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category",
      });
    }
  };

  const editTest = (index: number) => {
    const test = tests[index];
    testForm.reset({
      testName: test.testName,
      oldPrice: test.oldPrice,
      newPrice: test.newPrice,
      description: test.description,
    });
    setEditingTestIndex(index);
  };

  const removeTest = (index: number) => {
    setTests(tests.filter((_, i) => i !== index));
    if (editingTestIndex === index) {
      setEditingTestIndex(null);
      testForm.reset();
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">
              {editingCategoryId ? "Edit Test Category" : "Add Test Category"}
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          {/* Category Form */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Category Details</h3>
                <Form {...categoryForm}>
                  <form
                    onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={categoryForm.control}
                      name="categoryName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Category Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Diabetes Tests" 
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Category Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this test category..."
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400 min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {/* Test Form */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Add Test</h3>
                <Form {...testForm}>
                  <form
                    onSubmit={testForm.handleSubmit(onTestSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={testForm.control}
                      name="testName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Test Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Fasting Blood Sugar" 
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
                        control={testForm.control}
                        name="oldPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-700">Old Price (₹)</FormLabel>
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

                      <FormField
                        control={testForm.control}
                        name="newPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-700">New Price (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter new price" 
                                {...field}
                                className="bg-white/70 border-blue-200 focus:border-blue-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={testForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Test Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this test..."
                              {...field}
                              className="bg-white/70 border-blue-200 focus:border-blue-400 min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingTestIndex !== null ? "Update Test" : "Add Test"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

            {/* Right Side - Lists */}
            <div className="space-y-6">
              {/* List of Added Tests */}
              {tests.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">Tests in this Category</h3>
                  <div className="space-y-4">
                    {tests.map((test, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-lg text-blue-900">{test.testName}</h4>
                            <p className="text-sm text-gray-600">{test.description}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 line-through">₹{test.oldPrice}</span>
                              <span className="text-green-600 font-semibold text-lg">₹{test.newPrice}</span>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {Math.round(((parseInt(test.oldPrice) - parseInt(test.newPrice)) / parseInt(test.oldPrice)) * 100)}% off
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => editTest(index)}
                              className="hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeTest(index)}
                              className="hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save Category Button */}
                  <Button
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={categoryForm.handleSubmit(onCategorySubmit)}
                  >
                    {editingCategoryId ? "Update Category" : "Save Category"}
                  </Button>
                </div>
              )}

              {/* List of Existing Categories */}
              {categories && categories.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">Existing Categories</h3>
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const categoryTests = testItems?.filter(test => test.categoryId === category.id) || [];
                      return (
                        <div
                          key={category.id}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-medium text-lg text-blue-900">{category.name}</h4>
                              <p className="text-sm text-gray-600">{category.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => editCategory(category)}
                                className="hover:bg-blue-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteCategory(category.id)}
                                className="hover:bg-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {categoryTests.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {categoryTests.map((test, index) => (
                                <div
                                  key={index}
                                  className="pl-4 border-l-2 border-blue-200 hover:border-blue-400 transition-colors"
                                >
                                  <p className="font-medium text-blue-900">{test.testName}</p>
                                  <p className="text-sm text-gray-600">{test.description}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-gray-500 line-through">₹{test.oldPrice}</span>
                                    <span className="text-green-600 font-semibold">₹{test.newPrice}</span>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      {Math.round(((parseInt(test.oldPrice) - parseInt(test.newPrice)) / parseInt(test.oldPrice)) * 100)}% off
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCategoryForm; 