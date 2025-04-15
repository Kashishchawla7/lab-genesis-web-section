
import ParticleBackground from '@/components/ParticleBackground';
import AboutCard from '@/components/AboutCard';
import Navigation from '@/components/Navigation';

const Index = () => {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navigation />
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-4xl mx-auto pt-20 px-4">
        <div id="about-section">
          <AboutCard />
        </div>
      </div>
    </main>
  );
};

export default Index;
