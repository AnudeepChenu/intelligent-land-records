'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('data_entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          designation,
          role,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-slate-900 p-3 rounded-lg shadow">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900">
          Official Account Registration
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Digital Land Record Digitization & Validation Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-800 focus:outline-none"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Official Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-800 focus:outline-none"
                placeholder="e.g. Tehsildar / Land Record Officer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Designated Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-800 focus:outline-none"
              >
                <option value="data_entry">Data Entry Operator</option>
                <option value="verifier">Revenue Verifier / Inspector</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-800 focus:outline-none"
                placeholder="officer@nic.in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none disabled:opacity-50 transition"
            >
              {loading ? 'Registering...' : 'Register Official Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}