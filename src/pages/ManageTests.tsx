
import { useState } from "react";
import TestManagement from "@/components/TestManagement";
import TestCategoryForm from "@/components/TestCategoryForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ManageTests = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Tests</h1>
      
      <Tabs defaultValue="packages">
        <TabsList className="mb-6">
          <TabsTrigger value="packages">Test Packages</TabsTrigger>
          <TabsTrigger value="tests">Individual Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="packages">
          <TestCategoryForm />
        </TabsContent>
        
        <TabsContent value="tests">
          <TestManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageTests;
