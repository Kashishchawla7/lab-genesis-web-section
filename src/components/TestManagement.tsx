
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { TestMainCategory, TestItem } from "@/types/test";

const TestManagement = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["testMainCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_packages")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as TestMainCategory[];
    },
  });

  const { data: testItems, refetch: refetchItems } = useQuery({
    queryKey: ["testItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as TestItem[];
    },
  });

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const { error } = await supabase
        .from("test_packages")
        .insert([{
          name: formData.get("name"),
          description: formData.get("description"),
          price: Number(formData.get("price")),
        }]);

      if (error) throw error;
      
      toast({ title: "Success", description: "Category added successfully" });
      form.reset();
      refetchCategories();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category"
      });
    }
  };

  const handleAddTest = async (categoryId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const { error } = await supabase
        .from("test_items")
        .insert([{
          main_category_id: categoryId,
          name: formData.get("name"),
          description: formData.get("description"),
          price: Number(formData.get("price")),
        }]);

      if (error) throw error;
      
      toast({ title: "Success", description: "Test added successfully" });
      form.reset();
      refetchItems();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add test"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <Input name="name" placeholder="Category Name" required />
          <Textarea name="description" placeholder="Category Description" />
          <Input
            name="price"
            type="number"
            placeholder="Price"
            step="0.01"
            required
          />
          <Button type="submit">Add Category</Button>
        </form>
      </div>

      <div className="space-y-4">
        {categories?.map((category) => (
          <div key={category.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
              >
                {expandedCategory === category.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {expandedCategory === category.id && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Add New Test</h4>
                  <form onSubmit={(e) => handleAddTest(category.id, e)} className="space-y-4">
                    <Input name="name" placeholder="Test Name" required />
                    <Textarea name="description" placeholder="Test Description" />
                    <Input
                      name="price"
                      type="number"
                      placeholder="Price"
                      step="0.01"
                      required
                    />
                    <Button type="submit">Add Test</Button>
                  </form>
                </div>

                <div className="space-y-2">
                  {testItems?.filter(test => test.main_category_id === category.id)
                    .map(test => (
                      <div key={test.id} className="border rounded p-3">
                        <div className="flex justify-between">
                          <div>
                            <h5 className="font-medium">{test.name}</h5>
                            <p className="text-sm text-gray-600">{test.description}</p>
                            <p className="text-sm font-medium">₹{test.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestManagement;
