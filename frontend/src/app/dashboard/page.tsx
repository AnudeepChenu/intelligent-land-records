'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../lib/types';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
      setLoading(false);
    }
    getSession();
  }, [router]);

  if (loading) return <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50 text-slate-400">Loading workspace...</div>;

  const stats = [
    { label: 'Total Documents', value: '1,248', icon: FileText, color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/10', text: 'text-blue-500' },
    { label: 'Pending Review', value: '42', icon: Clock, color: 'from-amber-400 to-orange-400', bg: 'bg-amber-500/10', text: 'text-amber-500' },
    { label: 'Verified Records', value: '1,105', icon: CheckCircle2, color: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    { label: 'AI Flagged', value: '101', icon: AlertTriangle, color: 'from-rose-400 to-red-500', bg: 'bg-rose-500/10', text: 'text-rose-500' }
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-5rem)] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0]}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {profile?.designation} • {profile?.department}
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-900 rounded-full">
             <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
               Role: {profile?.role.replace('_', ' ')}
             </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-7 h-7 ${stat.text}`} />
                </div>
              </div>
              <div className="mt-6">
                <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}