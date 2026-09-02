'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle2, Clock, Activity, FileDigit, ArrowRight } from 'lucide-react';

export default function DashboardOverview() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();

    // Realtime Subscription for Live Progress Updates
    const channel = supabase
      .channel('realtime-dashboard-progress')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setDocuments((currentDocs) => currentDocs.filter((doc) => doc.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((currentDocs) =>
              currentDocs.map((doc) => (doc.id === payload.new.id ? payload.new : doc))
            );
          } else if (payload.eventType === 'INSERT') {
            setDocuments((currentDocs) => [payload.new, ...currentDocs]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (!error && data) setDocuments(data);
    setLoading(false);
  }

  // Calculate Progress Metrics
  const totalDocs = documents.length;
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const pendingCount = documents.filter((d) => d.status === 'pending' || d.status === 'processing').length;
  const extractedCount = documents.filter((d) => d.status === 'extracted').length;
  
  const completionPercentage = totalDocs > 0 ? Math.round((verifiedCount / totalDocs) * 100) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-6xl">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-4">
          Digitization Progress.
        </h1>
        <p className="text-lg text-slate-500 font-light tracking-wide max-w-2xl">
          Track system-wide extraction metrics and monitor your land record ingestion pipeline.
        </p>
      </div>

      {/* OVERALL PROGRESS BAR */}
      <div className="mb-8 p-6 bg-white border border-slate-200 shadow-sm rounded-sm">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">System Completion</h3>
            <p className="text-sm font-serif italic text-slate-400 mt-1">{verifiedCount} of {totalDocs} records secured</p>
          </div>
          <span className="text-3xl font-mono font-bold text-black">{completionPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-1000 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col justify-between">
          <div>
            <FileDigit className="w-5 h-5 text-blue-500 mb-3" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Uploaded</h4>
          </div>
          <p className="text-3xl font-mono text-black mt-4">{totalDocs}</p>
        </div>
        
        <div className="p-5 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col justify-between">
          <div>
            <Clock className="w-5 h-5 text-amber-500 mb-3" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Awaiting AI</h4>
          </div>
          <p className="text-3xl font-mono text-black mt-4">{pendingCount}</p>
        </div>
        
        <div className="p-5 bg-white border border-slate-200 rounded-sm shadow-sm border-l-2 border-l-amber-500 flex flex-col justify-between">
          <div>
            <Activity className="w-5 h-5 text-amber-600 mb-3" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Needs Human Review</h4>
          </div>
          <p className="text-3xl font-mono text-black mt-4">{extractedCount}</p>
        </div>
        
        <div className="p-5 bg-white border border-slate-200 rounded-sm shadow-sm border-l-2 border-l-emerald-500 flex flex-col justify-between">
          <div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-3" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Verified & Secured</h4>
          </div>
          <p className="text-3xl font-mono text-black mt-4">{verifiedCount}</p>
        </div>
      </div>

      {/* CALL TO ACTION */}
      <Link 
        href="/dashboard/verified"
        className="group inline-flex items-center justify-between w-full md:w-auto p-6 bg-slate-900 text-white rounded-sm hover:bg-black transition-colors shadow-md"
      >
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Open Verification Queue</h3>
          <p className="text-xs text-slate-400 font-light">Process pending documents and run AI extraction.</p>
        </div>
        <ArrowRight className="w-5 h-5 ml-8 group-hover:translate-x-1 transition-transform" />
      </Link>

    </div>
  );
}