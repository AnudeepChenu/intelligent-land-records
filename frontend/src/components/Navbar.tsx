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
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}