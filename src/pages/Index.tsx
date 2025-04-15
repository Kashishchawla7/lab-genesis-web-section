
import ParticleBackground from '@/components/ParticleBackground';
import AboutCard from '@/components/AboutCard';

const Index = () => {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <AboutCard />
      </div>
    </main>
  );
};

export default Index;
