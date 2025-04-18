import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Test {
  testName: string;
  price: string;
  description: string;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  tests: Test[];
}

const TestCategories = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["testCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_packages")
        .select("*");
      
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          toast({
            variant: "destructive",
            title: "Database Error",
            description: "Please create the test_categories table in Supabase first.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
        }
        throw error;
      }
      return (data as unknown as TestCategory[]) || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading test categories...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading test categories</p>
        <p className="text-sm text-gray-600 mt-2">
          Please make sure the test_categories table exists in your Supabase database.
        </p>
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-8">
        <p>No test categories available</p>
        <p className="text-sm text-gray-600 mt-2">
          Add some test categories in the Manage Tests section.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border rounded-lg overflow-hidden bg-white"
        >
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
            onClick={() => setExpandedCategory(
              expandedCategory === category.id ? null : category.id
            )}
          >
            <div className="text-left">
              <h3 className="font-semibold text-lg">{category.name}</h3>
              {/* <p className="text-sm text-gray-600">{category.description}</p> */}
            </div>
            {expandedCategory === category.id ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>

          {expandedCategory === category.id && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-4">
                {category.tests.map((test, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{test.testName}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{test.price}</p>
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
  );
};

export default TestCategories; 