
import MasterDataManager from "@/components/admin/MasterDataManager";

const MasterData = () => {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-6">Test Types</h2>
        <MasterDataManager type="test_type" title="Test Type" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Package Levels</h2>
        <MasterDataManager type="package_level" title="Package Level" />
      </div>
    </div>
  );
};

export default MasterData;
