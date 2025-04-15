
const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="particles">
        {Array.from({ length: 50 }).map((_, index) => (
          <div key={index} className="particle" style={{
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
            '--duration': `${Math.random() * 20 + 10}s`,
            '--delay': `${Math.random() * 5}s`
          } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
};

export default ParticleBackground;
