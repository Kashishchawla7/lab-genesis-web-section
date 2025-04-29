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
      description: "Access your test reports through our secure QR code"
    },
    {
      icon: <Phone className="w-8 h-8 text-blue-600" />,
      title: "ISO Certified",
      description: "We are ISO certified, ensuring the highest standards of quality and safety"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-xl font-semibold">Contact Us</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-gray-300">
              <a href="tel:+919355502226" className="flex items-center hover:text-white transition-colors">
                <Phone className="w-5 h-5 mr-2" />
                <span>+91 9355502226</span>
              </a>
              <a href="https://wa.me/919355502226" className="flex items-center hover:text-white transition-colors">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 11.7c0 6.45-5.27 11.68-11.78 11.68-2.07 0-4-.53-5.7-1.45L0 24l2.13-6.27a11.57 11.57 0 0 1-1.7-6.04C.44 5.23 5.72 0 12.23 0 18.72 0 24 5.23 24 11.7M12.22 1.85c-5.46 0-9.9 4.41-9.9 9.83 0 2.15.7 4.14 1.88 5.76L2.96 21.1l3.8-1.2a9.9 9.9 0 0 0 5.46 1.62c5.46 0 9.9-4.4 9.9-9.83a9.88 9.88 0 0 0-9.9-9.83z"/>
                </svg>
                <span>+91 9355502226</span>
              </a>
              <a href="mailto:ahujapathlabs@gmail.com" className="flex items-center hover:text-white transition-colors">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>ahujapathlabs@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-800">
            <p className="text-center text-gray-300 text-sm">
              Copyright © {new Date().getFullYear()} Ahuja Path Labs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default WhyBookWithUs; 