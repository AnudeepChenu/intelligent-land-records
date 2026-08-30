'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, X, ArrowRight } from 'lucide-react';
import { UserProfile } from '../lib/types';

export default function Navbar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else {
        setIsDrawerOpen(false);
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, designation, role: 'data_entry' } },
      });
      if (error) setErrorMsg(error.message);
      else {
        setIsDrawerOpen(false);
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <>
      {/* Modern Transparent Navbar */}
      <header className="fixed top-0 w-full z-40 bg-transparent mix-blend-difference">
        <div className="max-w-[1400px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-6 cursor-pointer text-white" onClick={() => router.push('/')}>
            <h1 className="text-xl tracking-[0.2em] uppercase font-light">
              LRMS <span className="font-bold opacity-70">Portal</span>
            </h1>
          </div>

          <div>
            {profile ? (
              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-3 text-right text-white">
                  <div>
                    <span className="block text-sm font-semibold">{profile.full_name}</span>
                    <span className="block text-xs uppercase tracking-wider opacity-60">{profile.role.replace('_', ' ')}</span>
                  </div>
                </div>
                <button onClick={handleSignOut} className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-x-8 text-sm uppercase tracking-widest font-medium text-white">
                <button onClick={() => { setAuthMode('login'); setIsDrawerOpen(true); }} className="hover:opacity-70 transition-opacity">
                  Sign In
                </button>
                <button onClick={() => { setAuthMode('signup'); setIsDrawerOpen(true); }} className="px-4 py-1 border border-white/30 hover:bg-white hover:text-black transition-colors">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Background Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
      )}

      {/* Slide-in Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#f9f9f9] z-50 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-serif text-black tracking-tight">
              {authMode === 'login' ? 'Welcome Back.' : 'Create Account.'}
            </h2>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-black/5 text-black/50 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-none text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6 flex-1 text-black">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-black/5 border-none rounded-none focus:outline-none focus:ring-1 focus:ring-black transition-all" placeholder="Ramesh Kumar" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Designation</label>
                  <input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full px-4 py-3 bg-black/5 border-none rounded-none focus:outline-none focus:ring-1 focus:ring-black transition-all" placeholder="Tehsildar" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Official Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-black/5 border-none rounded-none focus:outline-none focus:ring-1 focus:ring-black transition-all" placeholder="officer@nic.in" />
            </div>

            <div>
              <label className="block text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-black/5 border-none rounded-none focus:outline-none focus:ring-1 focus:ring-black transition-all" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-8 group flex items-center justify-between bg-black text-white px-6 py-4 hover:bg-black/80 transition-colors disabled:opacity-50">
              <span className="text-lg font-serif italic">{loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Register Official')}</span>
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/10 text-left">
            <p className="text-sm font-sans tracking-wide text-black/50">
              {authMode === 'login' ? "Don't have an account?" : "Already registered?"}
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="block mt-2 text-black font-serif italic text-lg hover:opacity-70 transition">
                {authMode === 'login' ? '(create one)' : '(sign in instead)'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}