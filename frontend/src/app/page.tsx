'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Fingerprint } from 'lucide-react';

const fullText = "ONE STEP TOWARDS DIGITAL INDIA";

export default function LandingPage() {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % fullText.length;
      
      if (!isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        setTypingSpeed(80);

        if (displayedText === fullText) {
          setTimeout(() => setIsDeleting(true), 2500);
          setTypingSpeed(40);
        }
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        setTypingSpeed(40);

        if (displayedText === '') {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, typingSpeed]);

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between p-8 md:p-12 relative overflow-hidden font-sans selection:bg-black/10 selection:text-black">
      
      {/* ==========================================
          BACKGROUND AMBIENT EFFECTS
      ========================================== */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-slate-200/50 blur-[120px] rounded-[100%] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200/50 blur-[100px] rounded-[100%] pointer-events-none" />

      {/* ==========================================
          TOP NAVIGATION (Elevated z-index)
      ========================================== */}
      <header className="relative z-50 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200/60 flex items-center justify-center border border-slate-300/50">
            <Fingerprint className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-sm tracking-[0.2em] uppercase font-bold text-black">
            LRMS <span className="font-light text-slate-400">Portal</span>
          </h1>
        </div>
        
        {/* Changed to standard <a> tags for guaranteed navigation */}
        <div className="flex gap-8 items-center">
          <a href="/login" className="text-xs uppercase tracking-widest font-mono text-slate-500 hover:text-black transition-colors duration-300 cursor-pointer">
            Login
          </a>
          <a href="/register" className="text-xs uppercase tracking-widest font-mono text-white bg-black px-5 py-2.5 rounded-full hover:bg-black/80 transition-colors duration-300 shadow-sm cursor-pointer">
            Register
          </a>
        </div>
      </header>

      {/* ==========================================
          HERO SECTION
      ========================================== */}
      <div className="relative z-40 flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto my-auto gap-16 py-20 pointer-events-none">
        
        {/* Left: Typography */}
        <div className="flex-1 text-center lg:text-left max-w-3xl pointer-events-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.1] text-black min-h-[180px] lg:min-h-[220px] flex items-center lg:justify-start justify-center">
            <span>
              {displayedText}
              <span className="inline-block w-1.5 h-10 md:h-14 lg:h-16 bg-black ml-2 animate-pulse align-middle" />
            </span>
          </h2>
        </div>

        {/* Right: Glassmorphism Card */}
        <div className="flex-1 w-full max-w-md relative z-50 pointer-events-auto">
          <div className="group relative p-10 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:border-slate-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
            
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="min-h-[70px] flex items-center relative z-10 pointer-events-none">
              <p className="font-serif text-2xl text-slate-900 leading-snug">
                An intelligent system for modern land administration.
              </p>
            </div>

            <p className="text-sm text-slate-500 font-light mt-6 mb-10 leading-relaxed relative z-10 pointer-events-none">
              A platform to securely digitize, automatically validate, and seamlessly integrate legacy land records using advanced AI and Computer Vision.
            </p>

            {/* Changed to standard <a> tag for guaranteed navigation */}
            <a 
              href="/login" 
              className="relative z-50 inline-flex items-center justify-between w-full p-4 bg-black text-white hover:bg-black/90 transition-all duration-300 rounded-xl shadow-md group/btn cursor-pointer"
            >
              <span className="text-xs uppercase tracking-widest font-bold text-white">Access Secure Node</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-black transition-colors duration-300">
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-0.5 transition-transform duration-300" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ==========================================
          FOOTER
      ========================================== */}
      <div className="relative z-40 w-full max-w-7xl mx-auto flex justify-between items-center text-[10px] uppercase font-mono text-slate-400 border-t border-slate-200/80 pt-8">
        <span className="tracking-widest">Telangana Revenue Framework</span>
        <span className="tracking-widest flex items-center gap-2 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Secured By AI
        </span>
      </div>

    </main>
  );
}