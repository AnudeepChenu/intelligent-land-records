'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard/upload');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-50">
      {/* Login Box */}
      <div className="max-w-md w-full mx-auto bg-white border border-slate-200/80 p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-black text-white rounded-lg mb-4">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-serif text-slate-900 font-normal">Sign In</h1>
          <p className="text-xs text-slate-500 font-light mt-1">Access your administrative registry dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded text-black bg-white text-sm focus:outline-none focus:border-black transition"
              placeholder="officer@telangana.gov.in"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded text-black bg-white text-sm focus:outline-none focus:border-black transition"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-slate-800 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <Link href="/register" className="text-xs text-slate-500 hover:text-black transition font-light">
            Need an account? <span className="underline">Register here</span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto text-center text-[10px] uppercase font-mono text-slate-400">
        Secured Authentication Gateway
      </div>
    </div>
  );
}