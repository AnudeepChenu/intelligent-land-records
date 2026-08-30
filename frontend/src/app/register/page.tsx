'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          official_designation: designation,
          designated_role: role,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-8">

      {/* Register Box */}
      <div className="max-w-md w-full mx-auto bg-white border border-slate-200/80 p-8 shadow-sm my-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-black text-white rounded-lg mb-4">
            <UserPlus className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-serif text-slate-900 font-normal">Create Account</h1>
          <p className="text-xs text-slate-500 font-light mt-1">Register for secure administrative portal access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center leading-relaxed">
            Registration successful! Please check your email inbox to confirm your account credentials before signing in.
            <div className="mt-4">
              <Link href="/login" className="underline font-bold">Proceed to Sign In</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded text-black bg-white text-sm focus:outline-none focus:border-black transition"
                placeholder="Rajeshwar Rao"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Official Designation</label>
              <input 
                type="text" 
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded text-black bg-white text-sm focus:outline-none focus:border-black transition"
                placeholder="District Revenue Officer"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Designated Role</label>
              <input 
                type="text" 
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded text-black bg-white text-sm focus:outline-none focus:border-black transition"
                placeholder="Verifier / Editor"
              />
            </div>

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
              {loading ? 'Creating Account...' : 'Register Official Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <Link href="/login" className="text-xs text-slate-500 hover:text-black transition font-light">
            Already have an account? <span className="underline">Sign In</span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto text-center text-[10px] uppercase font-mono text-slate-400">
        Credential Provisioning Framework
      </div>
    </div>
  );
}