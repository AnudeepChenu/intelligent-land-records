'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { FileCheck, CheckCircle2, Clock, AlertCircle, Eye, ArrowRight } from 'lucide-react';

export default function VerifiedDataPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchDocuments() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
      setLoading(false);
    }
    fetchDocuments();
  }, []);

  const handleRunAI = async (id: string) => {
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: id }),
      });
      const result = await response.json();
      if (response.ok) {
        setDocuments(documents.map(doc => doc.id === id ? { ...doc, status: 'extracted', extracted_text: result.preview } : doc));
        setSelectedDoc((prev: any) => ({ ...prev, status: 'extracted', extracted_text: result.preview }));
      } else {
        alert('Extraction failed: ' + result.detail);
      }
    } catch (err) {
      alert('Could not connect to Python AI engine.');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ status: 'verified' })
      .eq('id', id);

    if (!error) {
      setDocuments(documents.map(doc => doc.id === id ? { ...doc, status: 'verified' } : doc));
      if (selectedDoc?.id === id) setSelectedDoc({ ...selectedDoc, status: 'verified' });
    }
  };

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Editorial Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-4">
          Record Verification.
        </h1>
        <p className="text-lg text-slate-500 font-light tracking-wide max-w-2xl">
          Review AI-extracted land registry metadata, inspect raw OCR text, and issue official digital sign-offs.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-serif text-slate-400 italic text-lg">Loading records registry...</div>
      ) : documents.length === 0 ? (
        <div className="p-16 border border-black/5 bg-black/[002] text-center">
          <p className="font-serif italic text-lg text-slate-400">No documents found in the registry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Document List */}
          <div className="lg:col-span-1 border border-black/10 bg-white divide-y divide-black/5 max-h-[600px] overflow-y-auto">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDoc(doc)}
                className={`p-6 cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? 'bg-black/5' : 'hover:bg-black/[0.02]'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-black/40">
                    {doc.file_type?.includes('pdf') ? 'PDF Document' : 'Image Scan'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                    doc.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                    doc.status === 'extracted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <h4 className="font-serif text-black text-base truncate mb-1">{doc.file_name}</h4>
                <p className="text-xs text-slate-400 font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Document Detail & Reviewer Pane */}
          <div className="lg:col-span-2 border border-black/10 bg-white p-8 flex flex-col justify-between min-h-[600px]">
            {selectedDoc ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-black/10 pb-6">
                  <div>
                    <h2 className="text-2xl font-serif text-black">{selectedDoc.file_name}</h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">ID: {selectedDoc.id}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {selectedDoc.status === 'pending' && (
                      <button 
                        onClick={() => handleRunAI(selectedDoc.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-amber-600 text-white text-xs uppercase tracking-widest font-semibold hover:bg-amber-700 transition disabled:opacity-40"
                      >
                        {processing ? 'Running AI...' : 'Run AI Extraction'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleVerify(selectedDoc.id)}
                      disabled={selectedDoc.status === 'verified'}
                      className="px-6 py-2 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-black/80 transition disabled:opacity-40"
                    >
                      {selectedDoc.status === 'verified' ? 'Verified Record' : 'Approve & Verify'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-black/40 mb-3">AI Extracted Raw Text Preview</h3>
                  <div className="p-4 bg-black/[0.02] border border-black/5 font-mono text-xs text-slate-700 h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedDoc.extracted_text || "Extraction pending. Click 'Run AI Extraction' to process this document."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="font-serif italic text-lg">Select a document from the registry to inspect extraction results.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}