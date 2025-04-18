
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Test {
  id: string;
  name: string;
  type_id: string;
}

interface Package {
  id: string;
  name: string;
  new_price: number;
  old_price?: number;
  type_id: string;
  level_id: string;
  type_name?: string;
  level_name?: string;
  tests: Test[];
}

const TestCategories = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: packages, isLoading, error } = useQuery({
    queryKey: ["testPackages"],
    queryFn: async () => {
      // Fetch packages with types and levels
      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select(`
          *,
          type:test_type_mt(name),
          level:package_level_mt(name)
        `)
        .order('name');
      
      if (packagesError) {
        throw packagesError;
      }

      // Fetch tests for each package
      const packagesWithTests = await Promise.all(
        packagesData.map(async (pkg) => {
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

  if (isLoading) {
    return <div className="text-center py-8">Loading packages...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading packages</p>
        <p className="text-sm text-gray-600 mt-2">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!packages?.length) {
    return (
      <div className="text-center py-8">
        <p>No test packages available</p>
        <p className="text-sm text-gray-600 mt-2">
          Add some test packages in the Manage Tests section.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="border rounded-lg overflow-hidden bg-white"
        >
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
            onClick={() => setExpandedCategory(
              expandedCategory === pkg.id ? null : pkg.id
            )}
          >
            <div className="text-left">
              <h3 className="font-semibold text-lg">{pkg.name}</h3>
              <div className="flex gap-2 text-sm text-gray-600">
                <span>{pkg.type_name}</span>
                {pkg.level_name && (
                  <>
                    <span>•</span>
                    <span>{pkg.level_name}</span>
                  </>
                )}
              </div>
            </div>
            {expandedCategory === pkg.id ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>

          {expandedCategory === pkg.id && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-4">
                {pkg.tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 bg-white rounded-lg border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
                {pkg.tests.length === 0 && (
                  <p className="text-center text-gray-500 py-2">No tests added to this package yet.</p>
                )}
                <div className="text-right pt-2">
                  <p className="font-semibold text-blue-600">
                    ₹{pkg.new_price}
                    {pkg.old_price && (
                      <span className="text-gray-500 line-through ml-2">₹{pkg.old_price}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TestCategories;
