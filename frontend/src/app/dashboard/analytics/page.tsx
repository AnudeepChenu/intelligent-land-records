'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BarChart3, ShieldCheck, Clock, FileText, ArrowUpRight, Database, Cpu } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    extracted: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEngineStatus, setAiEngineStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    async function fetchAnalytics() {
      // 1. Fetch document stats from Supabase
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        const total = data.length;
        const verified = data.filter(d => d.status === 'verified').length;
        const pending = data.filter(d => d.status === 'pending').length;
        const extracted = data.filter(d => d.status === 'extracted').length;

        setStats({ total, verified, pending, extracted });
        setRecentActivity(data.slice(0, 5)); // Top 5 recent items
      }

      // 2. Check Python FastAPI Backend health
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          setAiEngineStatus('online');
        } else {
          setAiEngineStatus('offline');
        }
      } catch (err) {
        setAiEngineStatus('offline');
      }

      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Editorial Header */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-4">
            Registry Analytics.
          </h1>
          <p className="text-lg text-slate-500 font-light tracking-wide max-w-xl">
            Real-time telemetry, verification throughput, and local AI microservice telemetry.
          </p>
        </div>

        {/* System Health Badge */}
        <div className="hidden md:flex items-center space-x-3 px-4 py-2 border border-black/10 bg-white">
          <span className={`w-2.5 h-2.5 rounded-full ${
            aiEngineStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
            aiEngineStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400'
          }`} />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-600">
            AI Engine: {aiEngineStatus}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-serif text-slate-400 italic text-lg">Compiling registry metrics...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-black/10 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Registry</span>
                <FileText className="w-4 h-4 text-black/40" />
              </div>
              <div className="text-4xl font-serif text-black">{stats.total}</div>
              <p className="text-xs text-slate-400 font-mono mt-2">Active records in storage</p>
            </div>

            <div className="border border-black/10 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Verified & Signed</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600/60" />
              </div>
              <div className="text-4xl font-serif text-black">{stats.verified}</div>
              <p className="text-xs text-slate-400 font-mono mt-2">Official revenue clearance</p>
            </div>

            <div className="border border-black/10 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Extracted / Review</span>
                <Cpu className="w-4 h-4 text-amber-600/60" />
              </div>
              <div className="text-4xl font-serif text-black">{stats.extracted}</div>
              <p className="text-xs text-slate-400 font-mono mt-2">Awaiting final sign-off</p>
            </div>

            <div className="border border-black/10 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pending Intake</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-4xl font-serif text-black">{stats.pending}</div>
              <p className="text-xs text-slate-400 font-mono mt-2">New unparsed uploads</p>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Audit Log */}
            <div className="lg:col-span-2 border border-black/10 bg-white p-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6">Recent Ingestion Audit Trail</h3>
              
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 font-serif italic">No recent activity logged.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="py-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-serif text-black text-sm">{item.file_name}</h4>
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(item.uploaded_at).toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 ${
                        item.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'extracted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Info Card */}
            <div className="border border-black/10 bg-white p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-6">Infrastructure Status</h3>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-slate-500">Database Storage</span>
                    <span className="text-emerald-700 font-bold">Supabase Cloud</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-slate-500">Local OCR Engine</span>
                    <span className="text-emerald-700 font-bold">EasyOCR / PyMuPDF</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-black/5">
                    <span className="text-slate-500">Hardware Accelerator</span>
                    <span className="text-black font-bold">Apple Silicon (M-Series)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Security Protocol</span>
                    <span className="text-black font-bold">Row Level Security</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  System operational under regional land records digitization framework. All extracts are locally parsed and verified.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}