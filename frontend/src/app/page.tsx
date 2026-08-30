export default function HomePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* Full Screen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-[pulse_10s_ease-in-out_infinite_alternate]"
        style={{ 
          backgroundImage: '/Users/anudeep/DVS/intelligent-land-records/frontend/public/home-bg.jpg',
        }}
      />

      {/* Cinematic Overlays (Vignette & Gradient for text readability) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-orange-900/10 mix-blend-overlay" />

      {/* Content Container */}
      <div className="absolute inset-0 max-w-[1400px] mx-auto px-8 pb-16 flex flex-col justify-end">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-12">
          
          {/* Main Headline (Bottom Left) */}
          <div className="flex-1">
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[110px] leading-[0.9] text-white antialiased drop-shadow-2xl">
              One Step <br />
              <span className="italic opacity-90">Towards</span> <br />
              Digital India
            </h1>
          </div>

          {/* Frosted Glass Info Box (Bottom Right) */}
          <div className="w-full md:w-[420px] backdrop-blur-xl bg-black/20 border border-white/10 p-8 md:p-10 text-white/90 shadow-2xl relative overflow-hidden group">
            
            {/* Subtle glow effect inside the box */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full" />
            
            <h3 className="font-serif text-2xl md:text-3xl mb-4 leading-snug relative z-10">
              An intelligent system for <br /> modern land administration.
            </h3>
            <p className="text-sm font-sans tracking-wide leading-relaxed opacity-70 mb-8 relative z-10">
              A platform to securely digitize, automatically validate, and seamlessly integrate legacy land records using advanced AI and Computer Vision.
            </p>
            
            <p className="font-serif italic text-lg opacity-90 cursor-pointer hover:opacity-100 transition-opacity relative z-10 flex items-center gap-2">
              (access portal) <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}