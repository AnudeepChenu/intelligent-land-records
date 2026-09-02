'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Download, Edit3, Eye, CheckCircle2, ArrowLeft, FileText, ListFilter, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';

/* =========================================================
   COMPONENT 1: THE GLOBAL DOCUMENT QUEUE
========================================================= */
function VerificationQueue() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const router = useRouter();

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (!error && data) setDocuments(data);
    setLoading(false);
  }

  useEffect(() => {
    // 1. Fetch instantly on load
    fetchDocuments();

    // 2. Realtime WebSocket listener
    const channel = supabase
      .channel('realtime-verification-queue')
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

    // 3. Focus Listener (Bulletproof Cache Buster)
    const handleFocus = () => fetchDocuments();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'pending') return doc.status === 'pending' || doc.status === 'processing';
    if (activeTab === 'accepted') return doc.status === 'extracted' || doc.status === 'verified';
    if (activeTab === 'rejected') return doc.status === 'rejected';
    return false;
  });

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-black tracking-tight mb-2">Record Verification.</h1>
        <p className="text-sm text-slate-500 font-light max-w-2xl">
          Queue, process, and verify documents. Select a document below to begin AI extraction.
        </p>
      </div>

      <div className="border border-slate-200 bg-white flex flex-col shadow-sm rounded-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">
            <ListFilter className="w-4 h-4 mr-2" /> Global Document Queue
          </h3>
          
          <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
            {['pending', 'accepted', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeTab === tab ? 'bg-black text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab === 'accepted' ? 'Processed' : tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="min-h-[500px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {loading && documents.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
               <p className="text-slate-400 italic font-serif">Loading queue...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
               <FileText className="w-8 h-8 mb-4 opacity-50" />
               <p className="italic font-serif">No {activeTab} documents currently in the queue.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/dashboard/verified?id=${doc.id}`)}
                className="group p-5 border border-slate-200 rounded-sm bg-white hover:border-black hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-medium text-black group-hover:text-amber-700 transition-colors">
                      {doc.file_name}
                    </h4>
                    {doc.status === 'extracted' && (
                       <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] uppercase font-bold tracking-widest rounded-sm">Review Needed</span>
                    )}
                  </div>
                  <div className="flex space-x-4 text-[10px] uppercase font-mono text-slate-500 tracking-widest mt-2">
                    <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    {doc.overall_confidence > 0 && (
                      <span className="text-emerald-600 font-bold">{(doc.overall_confidence * 100).toFixed(0)}% AI CONFIDENCE</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT 2: THE 50/50 VERIFICATION EDITOR
========================================================= */
function VerificationEditor({ docId }: { docId: string }) {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [docLanguage, setDocLanguage] = useState('te');

  const [formData, setFormData] = useState({
    regNo: '', date: '', district: '', mandal: '',
    village: '', surveyNo: '', extent: '', owner: '', khata: '',
  });

  useEffect(() => {
    fetchDocument(docId);

    const channel = supabase
      .channel(`doc-${docId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents', filter: `id=eq.${docId}` },
        (payload) => {
          setSelectedDoc(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [docId]);

  async function fetchDocument(id: string) {
    setLoading(true);
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();

    if (!error && data) {
      setSelectedDoc(data);
      loadPreview(data);
      if (data.structured_data) {
        setFormData({
          regNo: data.structured_data.regNo || '',
          date: data.structured_data.date || '',
          district: data.structured_data.district || '',
          mandal: data.structured_data.mandal || '',
          village: data.structured_data.village || '',
          surveyNo: data.structured_data.surveyNo || '',
          extent: data.structured_data.extent || '',
          owner: data.structured_data.owner || '',
          khata: data.structured_data.khata || '',
        });
      }
    }
    setLoading(false);
  }

  async function loadPreview(doc: any) {
    const path = doc.structured_data?.annotated_path || doc.file_path;
    const { data, error } = await supabase.storage.from('land_records').createSignedUrl(path, 3600);
    if (!error && data) setPreviewUrl(data.signedUrl);
  }

  const handleRunAI = async () => {
    if (!selectedDoc) return;
    setProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: selectedDoc.id, language: docLanguage }),
      });

      if (response.ok) {
        await fetchDocument(selectedDoc.id); 
      } else {
        alert('Extraction failed.');
      }
    } catch (err) {
      alert('Could not connect to Python AI engine.');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedDoc) return;
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'verified',
        structured_data: { ...selectedDoc.structured_data, ...formData }
      })
      .eq('id', selectedDoc.id);

    if (!error) {
      setSelectedDoc({ ...selectedDoc, status: 'verified', structured_data: { ...selectedDoc.structured_data, ...formData } });
    }
  };

  const handleDownloadCertificate = () => {
    const pdf = new jsPDF();
    pdf.text('Verified Record Certificate', 20, 20);
    pdf.text(`Survey No: ${formData.surveyNo}`, 20, 30);
    pdf.text(`Owner: ${formData.owner}`, 20, 40);
    pdf.save(`Verified_${formData.surveyNo || 'Record'}.pdf`);
  };

  if (loading) {
    return <div className="p-12 text-center font-serif italic text-slate-400">Loading document data...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Header with Back Button to return to Queue */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => router.push('/dashboard/verified')}
            className="flex items-center text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue
          </button>
          <h1 className="text-4xl font-serif text-black tracking-tight mb-2">Verification Portal.</h1>
          <p className="text-sm text-slate-500 font-light">
            Currently viewing: <span className="font-medium text-black">{selectedDoc?.file_name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh] min-h-[700px]">
        
        {/* LIVE PREVIEW */}
        <div className="border border-slate-200 bg-slate-100 flex flex-col shadow-sm min-w-0 min-h-0 rounded-sm">
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center rounded-t-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">
              <Eye className="w-3 h-3 mr-2" />
              Live Preview {selectedDoc?.structured_data?.annotated_path && "(AI Annotated)"}
            </h3>
          </div>
          <div className="flex-1 p-4 min-h-0 overflow-auto bg-slate-200/50 flex justify-center items-start">
            {!previewUrl ? (
               <div className="h-full flex items-center justify-center text-slate-400 font-serif italic text-sm">Loading preview...</div>
            ) : selectedDoc?.structured_data?.annotated_path ? (
               <img src={previewUrl} alt="Annotated Preview" className="max-w-full shadow-md border border-slate-300" />
            ) : (
               <iframe src={previewUrl} className="w-full h-full shadow-sm border border-slate-200 bg-white" title="Document Preview" />
            )}
          </div>
        </div>

        {/* VERIFICATION PANEL */}
        <div className="border border-slate-200 bg-white flex flex-col shadow-sm min-w-0 min-h-0 rounded-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-sm">
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">
              <Edit3 className="w-3 h-3 mr-2" /> Verification Form
            </h3>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                
                {selectedDoc?.overall_confidence > 0 && (
                  <div className="p-4 border border-slate-200 bg-slate-50 flex items-center justify-between rounded-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Overall Confidence</p>
                        <p className="text-xs font-serif text-slate-400 mt-1">Review colored bounding boxes in preview</p>
                      </div>
                      <span className="text-3xl font-mono font-bold text-black">
                        {(selectedDoc.overall_confidence * 100).toFixed(1)}%
                      </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Registration No.</label>
                    <input type="text" name="regNo" value={formData.regNo} onChange={(e) => setFormData({...formData, regNo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Date of Issue</label>
                    <input type="text" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">District</label>
                    <input type="text" name="district" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Mandal</label>
                    <input type="text" name="mandal" value={formData.mandal} onChange={(e) => setFormData({...formData, mandal: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Village</label>
                    <input type="text" name="village" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Survey Number</label>
                    <input type="text" name="surveyNo" value={formData.surveyNo} onChange={(e) => setFormData({...formData, surveyNo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Total Extent</label>
                  <input type="text" name="extent" value={formData.extent} onChange={(e) => setFormData({...formData, extent: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Landholder Name</label>
                  <input type="text" name="owner" value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Khata Number</label>
                  <input type="text" name="khata" value={formData.khata} onChange={(e) => setFormData({...formData, khata: e.target.value})} className="w-full px-3 py-2 border border-slate-200 text-sm focus:border-black focus:outline-none transition-colors" />
                </div>

                {selectedDoc?.extracted_text && (
                  <div className="mt-6">
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Extracted Raw Text (Read-Only)</label>
                      <div className="w-full h-40 px-4 py-3 border border-slate-200 text-xs text-slate-600 bg-slate-50 overflow-y-auto whitespace-pre-wrap rounded-sm leading-relaxed">
                        {selectedDoc.extracted_text}
                      </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3 flex-shrink-0">
              {(selectedDoc?.status === 'pending' || selectedDoc?.status === 'processing') && (
                <>
                  <select value={docLanguage} onChange={(e) => setDocLanguage(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 text-xs focus:border-black mb-2 rounded-sm outline-none">
                    <option value="te">English + Telugu OCR</option>
                    <option value="mr">English + Marathi OCR</option>
                    <option value="hi">English + Hindi OCR</option>
                    <option value="en">English Only OCR</option>
                  </select>
                  <button type="button" onClick={handleRunAI} disabled={processing} className="w-full py-3 bg-amber-600 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-amber-700 disabled:opacity-40 rounded-sm transition-colors shadow-sm">
                    {processing ? 'AI Engine Processing...' : 'Run AI Extraction'}
                  </button>
                </>
              )}
              {selectedDoc?.status === 'extracted' && (
                <button type="button" onClick={handleVerify} className="w-full py-3 bg-black text-white text-[10px] uppercase font-bold tracking-widest hover:bg-black/80 flex justify-center items-center rounded-sm transition-colors shadow-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Verify Form Data
                </button>
              )}
              {selectedDoc?.status === 'verified' && (
                <button type="button" onClick={handleDownloadCertificate} className="w-full py-3 bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-emerald-800 flex justify-center items-center rounded-sm transition-colors shadow-sm">
                  <Download className="w-4 h-4 mr-2" /> Download Certified Copy
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ROUTING WRAPPER
========================================================= */
function VerifiedContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');

  if (docId) {
    return <VerificationEditor docId={docId} />;
  }
  return <VerificationQueue />;
}

export default function VerifiedDataPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 italic font-serif">Initializing Portal...</div>}>
      <VerifiedContent />
    </Suspense>
  );
}