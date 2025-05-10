
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MasterDataManager from "@/components/admin/MasterDataManager";
import AdminNotifications from "@/components/admin/AdminNotifications";

const MasterData = () => {
  return (
    <div className="min-h-screen pt-20 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto pb-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Master Data Management</h1>
        
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8 w-[400px] mx-auto">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="master-data">Master Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-6">Booking Notifications</h2>
              <AdminNotifications />
            </div>
          </TabsContent>
          
          <TabsContent value="master-data">
            <MasterDataManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MasterData;
