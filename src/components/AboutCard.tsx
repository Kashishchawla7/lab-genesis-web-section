
import { Linkedin, Twitter, Instagram } from 'lucide-react';

const AboutCard = () => {
  return (
    <div className="relative transform transition-all duration-500 hover:scale-[1.01]">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-2xl blur-xl">
      </div>
      <div className="relative px-8 py-10 backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg">
        <h2 className="text-4xl font-bold mb-6 text-blue-900 bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
          About Us
        </h2>
        <p className="text-gray-800 text-lg leading-relaxed mb-8">
          At Ahuja Lab Pharmaceuticals, we are committed to advancing healthcare through innovative pharmaceutical research and precision laboratory solutions. With cutting-edge technology and a dedicated team of scientists, we strive to make a meaningful impact on global wellness.
        </p>
        <div className="flex justify-center space-x-8 mt-8">
          <a 
            href="#" 
            className="text-blue-600 hover:text-blue-800 transform hover:scale-110 transition-all duration-300"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-7 h-7" />
          </a>
          <a 
            href="#" 
            className="text-blue-600 hover:text-blue-800 transform hover:scale-110 transition-all duration-300"
            aria-label="Twitter"
          >
            <Twitter className="w-7 h-7" />
          </a>
          <a 
            href="#" 
            className="text-blue-600 hover:text-blue-800 transform hover:scale-110 transition-all duration-300"
            aria-label="Instagram"
          >
            <Instagram className="w-7 h-7" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutCard;
