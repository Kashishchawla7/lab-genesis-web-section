import { 
  Microscope, 
  Clock3, 
  Beaker, 
  ShieldCheck, 
  Laptop, 
  Phone, 
  Building2, 
  HeartPulse,
  BarChart4
} from "lucide-react";

const WhyBookWithUs = () => {
  const features = [
    {
      icon: <Microscope className="w-8 h-8 text-blue-600" />,
      title: "Advanced Lab Equipment",
      description: "State-of-the-art automated analyzers ensuring precise and accurate test results"
    },
    {
      icon: <Laptop className="w-8 h-8 text-blue-600" />,
      title: "Digital Reports",
      description: "Access your test reports online anytime, anywhere through our secure patient portal"
    },
    {
      icon: <Phone className="w-8 h-8 text-blue-600" />,
      title: "Mobile App Access",
      description: "Book tests, view reports, and track your health journey through our mobile app"
    },
    {
      icon: <Clock3 className="w-8 h-8 text-blue-600" />,
      title: "Quick Turnaround Time",
      description: "Advanced automation enabling faster processing and reporting of test results"
    },
    {
      icon: <Building2 className="w-8 h-8 text-blue-600" />,
      title: "Modern Facilities",
      description: "Temperature-controlled labs with uninterrupted power supply for sample integrity"
    },
    {
      icon: <BarChart4 className="w-8 h-8 text-blue-600" />,
      title: "Trend Analysis",
      description: "Track your health parameters over time with our intelligent analytics"
    }
  ];

  return (
    <>
      <div className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
              Why Choose Our Lab?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of advanced technology and expert care. Our state-of-the-art facilities
              ensure accurate results and a seamless diagnostic experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-200 hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <HeartPulse className="w-6 h-6 text-blue-600 mr-2" />
              <p className="text-blue-800 font-medium">
                Experience the future of diagnostics. Book your test today!
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#1e3a8a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-300">Email: ahujapathlabs@gmail.com</li>
                <li className="text-gray-300">Phone: 9355502226</li>
                <li className="text-gray-300">WhatsApp: +91 9355502226</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800">
            <p className="text-center text-gray-300 text-sm">
              Copyright © {new Date().getFullYear()} Ahuja Path Labs. All rights reserved.
            </p>
          </div>
        {/* </div> */}
      </footer>
    </>
  );
};

export default WhyBookWithUs; 