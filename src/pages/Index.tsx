import TestCategories from "@/components/TestCategories";
import WhyBookWithUs from "@/components/WhyBookWithUs";

const Index = () => {
  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <TestCategories />
      </div>
      <WhyBookWithUs />
    </div>
  );
};

export default Index;
