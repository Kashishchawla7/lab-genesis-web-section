import { Check, Truck, Home, BadgePercent } from "lucide-react";
import { useState, useEffect } from "react";

const WhyBookWithUs = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: Check,
      title: "Quality",
      description: "Follow Stringent Quality Control Practices",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      iconBg: "bg-green-100"
    },
    {
      icon: Truck,
      title: "On-Time Services",
      description: "Sample Collection & Reports",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100"
    },
    {
      icon: Home,
      title: "Doorstep Sample Pickup",
      description: "Convenient home collection service",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100"
    },
    {
      icon: BadgePercent,
      title: "Accurate Results",
      description: "100% Accurate or Money Back Guarantee",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#004236] mb-4">Why Book Tests With us?</h2>
          <div className="w-24 h-1 bg-[#004236] mx-auto rounded-full mb-6"></div>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className={`${feature.bgColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 ${feature.iconBg} rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 hover:scale-110`}>
                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                      <p className="text-gray-600 text-lg">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Navigation */}
          <div className="flex justify-center mt-8 gap-3">
            {features.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-[#004236] w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-all"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-all"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % features.length)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhyBookWithUs; 