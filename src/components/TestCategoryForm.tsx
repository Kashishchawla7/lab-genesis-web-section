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
  price: z.string().min(1, "Price is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const categorySchema = z.object({
  categoryName: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

interface Test {
  testName?: string;
  price?: string;
  description?: string;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  tests: Test[];
}

const TestCategoryForm = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories, refetch } = useQuery({
    queryKey: ["testCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_categories")
        .select("*");
      
      if (error) throw error;
      return data as TestCategory[];
    },
  });

  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testName: "",
      price: "",
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
            tests: tests,
          })
          .eq("id", editingCategoryId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from("test_categories")
          .insert([
            {
              name: values.categoryName,
              description: values.description,
              tests: tests,
            },
          ]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      
      // Reset forms
      categoryForm.reset();
      setTests([]);
      setEditingCategoryId(null);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save category",
      });
    }
  };

  const editCategory = (category: TestCategory) => {
    categoryForm.reset({
      categoryName: category.name,
      description: category.description,
    });
    setTests(category.tests);
    setEditingCategoryId(category.id);
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("test_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      refetch();
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
      price: test.price,
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
    <div className="max-w-4xl mx-auto p-6 bg-white/80 backdrop-blur-md rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
        {editingCategoryId ? "Edit Test Category" : "Add Test Category"}
      </h2>

      {/* Category Form */}
      <Form {...categoryForm}>
        <form
          onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
          className="space-y-6 mb-8"
        >
          <FormField
            control={categoryForm.control}
            name="categoryName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Diabetes Tests" {...field} />
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
                <FormLabel>Category Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe this test category..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Test Form */}
      <Form {...testForm}>
        <form
          onSubmit={testForm.handleSubmit(onTestSubmit)}
          className="space-y-6 mb-8"
        >
          <FormField
            control={testForm.control}
            name="testName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Fasting Blood Sugar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={testForm.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={testForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe this test..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            {editingTestIndex !== null ? "Update Test" : "Add Test"}
          </Button>
        </form>
      </Form>

      {/* List of Added Tests */}
      {tests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Added Tests</h3>
          {tests.map((test, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <h4 className="font-medium">{test.testName}</h4>
                <p className="text-sm text-gray-600">{test.description}</p>
                <p className="text-sm font-medium">₹{test.price}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => editTest(index)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeTest(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Category Button */}
      {tests.length > 0 && (
        <Button
          className="w-full mt-6"
          onClick={categoryForm.handleSubmit(onCategorySubmit)}
        >
          {editingCategoryId ? "Update Category" : "Save Category"}
        </Button>
      )}

      {/* List of Existing Categories */}
      {categories && categories.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 border rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => editCategory(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {category.tests.map((test, index) => (
                    <div
                      key={index}
                      className="pl-4 border-l-2 border-gray-200"
                    >
                      <p className="font-medium">{test.testName}</p>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      <p className="text-sm font-medium">₹{test.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCategoryForm; 