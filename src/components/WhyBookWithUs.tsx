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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
              Why Choose Ahuja Path Labs?
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

          {/* Facilities Section */}


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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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