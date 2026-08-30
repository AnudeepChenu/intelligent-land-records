'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { FileCheck, Download, Edit3, Eye, FileText, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function VerifiedDataPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState({
    regNo: '',
    date: '',
    district: '',
    mandal: '',
    village: '',
    surveyNo: '',
    extent: '',
    owner: '',
    khata: ''
  });

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

  // Simple Frontend Parser to extract fields from the raw OCR paragraph
  const parseExtractedText = (text: string) => {
    if (!text) return;
    const safeMatch = (regex: RegExp) => {
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    setFormData({
      regNo: safeMatch(/Registration No:\s*(.*?)\s*Date/i) || safeMatch(/Registration No:\s*([^\s]+)/i),
      date: safeMatch(/Date of Issue:\s*(.*?)\s*1\./i),
      district: safeMatch(/District:\s*(.*?)\s*Mandal:/i),
      mandal: safeMatch(/Mandal:\s*(.*?)\s*Village:/i),
      village: safeMatch(/Village:\s*(.*?)\s*Survey/i),
      surveyNo: safeMatch(/Survey Number:\s*(.*?)\s*Total/i),
      extent: safeMatch(/Total Extent:\s*(.*?)\s*Land/i),
      owner: safeMatch(/Landholder Name:\s*(.*?)\s*Father/i),
      khata: safeMatch(/Khata Number:\s*(\d+)/i),
    });
  };
  const handleSelectDoc = async (doc: any) => {
    setSelectedDoc(doc);
    
    // Check your Supabase Storage to ensure your bucket is exactly named 'land_records'
    // Generate a secure temporary URL for the private document (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('land_records') 
      .createSignedUrl(doc.file_path, 3600);

    if (error) {
      console.error("Error loading document:", error);
      alert("Could not load preview. Check if the bucket 'land_records' exists in Supabase.");
    } else if (data) {
      setPreviewUrl(data.signedUrl);
    }
    
    parseExtractedText(doc.extracted_text);
  };

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
        const updatedDoc = { ...selectedDoc, status: 'extracted', extracted_text: result.preview };
        setSelectedDoc(updatedDoc);
        parseExtractedText(result.preview);
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
      .update({ status: 'verified', extracted_text: JSON.stringify(formData) }) // Optionally save the edited JSON back
      .eq('id', id);

    if (!error) {
      setDocuments(documents.map(doc => doc.id === id ? { ...doc, status: 'verified' } : doc));
      if (selectedDoc?.id === id) setSelectedDoc({ ...selectedDoc, status: 'verified' });
    }
  };

  // Generate Official Certificate PDF using the EDITED form data
  const handleDownloadCertificate = () => {
    const pdf = new jsPDF();
    
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, 190, 277);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("GOVERNMENT OF TELANGANA", 105, 25, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("OFFICE OF THE DISTRICT REVENUE AUTHORITY", 105, 33, { align: "center" });
    
    pdf.setLineWidth(0.2);
    pdf.line(20, 40, 190, 40);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("OFFICIAL LAND REGISTRY VERIFICATION CERTIFICATE", 105, 55, { align: "center" });

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Verification Status: OFFICIALLY VERIFIED & SIGNED`, 20, 75);
    pdf.text(`Registration No: ${formData.regNo}`, 20, 85);
    pdf.text(`Date of Issue: ${formData.date}`, 20, 95);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("LAND PARTICULARS:", 20, 115);
    pdf.setFont("helvetica", "normal");
    pdf.text(`District: ${formData.district}`, 20, 125);
    pdf.text(`Mandal: ${formData.mandal}`, 20, 132);
    pdf.text(`Village: ${formData.village}`, 20, 139);
    pdf.text(`Survey Number: ${formData.surveyNo}`, 20, 146);
    pdf.text(`Total Extent: ${formData.extent}`, 20, 153);

    pdf.setFont("helvetica", "bold");
    pdf.text("OWNERSHIP DETAILS:", 20, 173);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Registered Landholder: ${formData.owner}`, 20, 183);
    pdf.text(`Khata Number: ${formData.khata}`, 20, 190);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("DIGITALLY SIGNED BY LAND RECORDS AI ENGINE", 20, 240);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 247);

    pdf.save(`Verified_Record_${formData.surveyNo || 'Certificate'}.pdf`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out p-6">
      
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-2">Record Verification.</h1>
        <p className="text-sm text-slate-500 font-light tracking-wide max-w-2xl">
          Review document previews side-by-side, edit AI-extracted metadata, and issue official digital sign-offs.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-serif text-slate-400 italic text-lg">Loading records registry...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh] min-h-[600px]">
          
          {/* Column 1: Document List (Left) */}
          <div className="lg:col-span-3 border border-slate-200 bg-white flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Registry Queue</h3>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-4 cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? 'bg-slate-50 border-l-2 border-black' : 'hover:bg-slate-50/50 border-l-2 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center">
                      <FileText className="w-3 h-3 mr-1" /> PDF
                    </span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${
                      doc.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'extracted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <h4 className="font-serif text-black text-sm truncate">{doc.file_name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Document Preview (Middle) */}
          <div className="lg:col-span-5 border border-slate-200 bg-slate-100 flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">
                <Eye className="w-3 h-3 mr-2" /> Live Preview
              </h3>
            </div>
            <div className="flex-1 p-2">
              {previewUrl ? (
                <iframe src={previewUrl} className="w-full h-full bg-white shadow-sm border border-slate-200" title="Document Preview" />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-serif italic text-sm">
                  Select a document to preview
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Extracted Details & Actions (Right) */}
          <div className="lg:col-span-4 border border-slate-200 bg-white flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">
                <Edit3 className="w-3 h-3 mr-2" /> Extracted Details
              </h3>
            </div>
            
            {selectedDoc ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Registration No.</label>
                      <input type="text" name="regNo" value={formData.regNo} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Date of Issue</label>
                      <input type="text" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">District</label>
                      <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Mandal</label>
                      <input type="text" name="mandal" value={formData.mandal} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Village</label>
                      <input type="text" name="village" value={formData.village} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Survey Number</label>
                      <input type="text" name="surveyNo" value={formData.surveyNo} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Total Extent</label>
                    <input type="text" name="extent" value={formData.extent} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Landholder Name</label>
                    <input type="text" name="owner" value={formData.owner} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Khata Number</label>
                    <input type="text" name="khata" value={formData.khata} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none" />
                  </div>

                </div>
                
                {/* Action Buttons Pinned to Bottom */}
                <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                  {selectedDoc.status === 'pending' && (
                    <button onClick={() => handleRunAI(selectedDoc.id)} disabled={processing} className="w-full py-2.5 bg-amber-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-amber-700 transition disabled:opacity-40">
                      {processing ? 'Processing Document...' : 'Run AI Extraction'}
                    </button>
                  )}
                  {selectedDoc.status !== 'verified' ? (
                    <button onClick={() => handleVerify(selectedDoc.id)} className="w-full py-2.5 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-black/80 transition flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 mr-2" /> Approve & Verify Edits
                    </button>
                  ) : (
                    <button onClick={handleDownloadCertificate} className="w-full py-2.5 bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-800 transition flex items-center justify-center">
                      <Download className="w-3 h-3 mr-2" /> Download Final PDF
                    </button>
                  )}
                </div>
              </div>
            ) : (
               <div className="flex-1 flex items-center justify-center text-slate-400 font-serif italic text-sm p-8 text-center">
                  Select a document from the queue to view and edit details.
               </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}