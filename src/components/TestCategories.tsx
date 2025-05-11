import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
  test_type_mt?: { name: string };
  package_level_mt?: { name: string };
  tests: Test[];
}

const facilities = [
  {
    value: "ecg",
    label: "ECG",
    desc: "Electrocardiogram (ECG) services for heart health assessment.",
    icon: (
      <svg className="h-6 w-6 text-blue-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3 8 4-16 3 8h4" />
      </svg>
    ),
  },
  {
    value: "microbiology",
    label: "MICRO BIOLOGY",
    desc: "Comprehensive microbiology testing for infection diagnosis.",
    icon: (
      <svg className="h-6 w-6 text-green-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
      </svg>
    ),
  },
  {
    value: "clinical-pathology",
    label: "CLINICAL PATHOLOGY",
    desc: "Analysis of blood, urine, and other body fluids for disease detection.",
    icon: (
      <svg className="h-6 w-6 text-yellow-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
  {
    value: "biochemistry",
    label: "BIOCHEMISTRY",
    desc: "Biochemical analysis for metabolic and organ function assessment.",
    icon: (
      <svg className="h-6 w-6 text-purple-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
  {
    value: "serology-urology",
    label: "SEROLOGY, UROLOGY",
    desc: "Serological and urological tests for infection and health monitoring.",
    icon: (
      <svg className="h-6 w-6 text-pink-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
  {
    value: "immunology",
    label: "IMMUNOLOGY",
    desc: "Immunological tests for immune system evaluation.",
    icon: (
      <svg className="h-6 w-6 text-teal-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
  {
    value: "hematology",
    label: "HEMATOLOGY",
    desc: "Comprehensive blood analysis for various health conditions.",
    icon: (
      <svg className="h-6 w-6 text-red-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
  {
    value: "endocrinology",
    label: "ENDOCRINOLOGY",
    desc: "Hormonal and endocrine system testing for metabolic health.",
    icon: (
      <svg className="h-6 w-6 text-indigo-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
      </svg>
    ),
  },
];

const TestCategories = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{ types: string[]; levels: string[] }>({
    types: [],
    levels: []
  });
  const { toast } = useToast();

  const { data: types } = useQuery({
    queryKey: ["testTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_type_mt")
        .select("*")
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: levels } = useQuery({
    queryKey: ["packageLevels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_level_mt")
        .select("*")
        .order('name');
      if (error) throw error;
      return data;
    },
  });

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
            tests: testsData?.map(test => ({
              id: test.id,
              name: test.name,
              type_id: '' // Default empty string for type_id
            })) || []
          };
        })
      );
      
      return packagesWithTests as unknown as Package[];
    },
  });

  const filteredPackages = packages?.filter(pkg => {
    const typeMatch = selectedFilters.types.length === 0 || 
      (pkg.type?.name && selectedFilters.types.includes(pkg.type.name));
    const levelMatch = selectedFilters.levels.length === 0 || 
      (pkg.level?.name && selectedFilters.levels.includes(pkg.level.name));
    return typeMatch && levelMatch;
  }) || [];

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
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#004236] mb-4 flex items-center justify-center">
            <span className="bg-[#004236] p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
            Wide Range of Wellness Health Packages
          </h2>
          <p className="text-gray-600 text-lg">Health Checkup / Fever Panels</p>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Column */}
            <div className="lg:w-1/4 w-full mb-6 lg:mb-0">
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    <div className="flex items-center gap-2">
                      {(selectedFilters.types.length > 0 || selectedFilters.levels.length > 0) && (
                        <button
                          onClick={() => setSelectedFilters({ types: [], levels: [] })}
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
                            onClick={() => setSelectedFilters(prev => ({
                              ...prev,
                              types: prev.types.includes(type.name)
                                ? prev.types.filter(item => item !== type.name)
                                : [...prev.types, type.name]
                            }))}
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
                            onClick={() => setSelectedFilters(prev => ({
                              ...prev,
                              levels: prev.levels.includes(level.name)
                                ? prev.levels.filter(item => item !== level.name)
                                : [...prev.levels, level.name]
                            }))}
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
            <div className="lg:w-3/4 w-full">
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
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pkg.type?.name && (
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                {pkg.type.name}
                              </span>
                            )}
                            {pkg.level?.name && (
                              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                                {pkg.level.name}
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

        {/* Facilities Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center underline decoration-blue-600/40 underline-offset-8 tracking-wide">
            FACILITIES
          </h2>
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {facilities.map((facility) => (
                <Accordion type="single" collapsible key={facility.value} className="w-full">
                  <AccordionItem value={facility.value} className="rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition">
                    <AccordionTrigger className="flex items-center text-lg font-semibold text-blue-800 px-4 py-3 rounded-lg hover:bg-blue-50 transition">
                      {facility.icon}
                      <span>{facility.label}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 px-6 pb-4 pt-2">
                      {facility.desc}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
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
