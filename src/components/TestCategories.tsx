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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#004236] mb-4 flex items-center justify-center">
            <span className="bg-[#004236] p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
            Available Test Packages
          </h2>
          <p className="text-gray-600 text-lg">Choose from our comprehensive range of diagnostic tests</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
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
                    {pkg.type_name && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        {pkg.type_name}
                      </span>
                    )}
                    {pkg.level_name && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium inline-flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                        {pkg.level_name}
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
                  <div className="grid grid-cols-2 gap-2">
                    {pkg.tests?.slice(0, expandedCategory === pkg.id ? undefined : 4).map((test) => (
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
                  {!expandedCategory === pkg.id && pkg.tests?.length > 4 && (
                    <div className="text-center text-sm text-gray-500">
                      +{pkg.tests.length - 4} more tests
                    </div>
                  )}
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

        {!packages?.length && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Packages Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Add some test packages in the Manage Tests section to get started.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004236] mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading packages...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16 bg-red-50 rounded-xl border border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Packages</h3>
            <p className="text-red-600 max-w-md mx-auto text-sm">
              {(error as Error).message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCategories;
