'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 1500);
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
    <main className="min-h-screen bg-black text-white flex flex-col justify-between p-8 md:p-16 select-none">
      
      {/* Top Bar */}


      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-auto my-auto gap-16 py-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-snug min-h-[160px] flex items-center">
            <span>
              {displayedText}
              <span className="inline-block w-2 h-8 bg-white ml-1 animate-pulse align-middle" />
            </span>
          </h1>
        </div>

        <div className="flex-1 w-full max-w-md">
          <div className="p-8 border border-white/10 bg-white/[0.02] backdrop-blur-sm relative overflow-hidden shadow-2xl">
            <div className="min-h-[70px] flex items-center">
              <p className="font-serif text-lg text-white/90 leading-snug">
                An intelligent system for modern land administration.
              </p>
            </div>

            <p className="text-xs text-white/50 font-light mt-6 mb-8 leading-relaxed">
              A platform to securely digitize, automatically validate, and seamlessly integrate legacy land records using advanced AI and Computer Vision.
            </p>

            <Link 
              href="/login" 
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-mono text-white hover:text-white/70 transition group"
            >
              <span>(ACCESS PORTAL)</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex justify-between items-center text-[10px] uppercase font-mono text-white/30">
        <span>Telangana Revenue Framework</span>
        <span>Secured Node</span>
      </div>

    </main>
  );
}