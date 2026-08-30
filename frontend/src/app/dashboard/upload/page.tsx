'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Upload, X, ArrowRight, Check } from 'lucide-react';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadStatus(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired.");

      for (const file of files) {
        const safeFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `${user.id}/${safeFileName}`;

        const { error: storageError } = await supabase.storage.from('land_records').upload(filePath, file);
        if (storageError) throw storageError;

        const { error: dbError } = await supabase.from('documents').insert({
          uploader_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
        });
        if (dbError) throw dbError;
      }

      setUploadStatus({ type: 'success', message: 'Documents successfully digitized and secured.' });
      setFiles([]);
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Editorial Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-4">
          Document Ingestion.
        </h1>
        <p className="text-lg text-slate-500 font-light tracking-wide max-w-2xl">
          Securely upload legacy registers, cadastral maps, or standard land records for AI processing.
        </p>
      </div>

      {uploadStatus && (
        <div className={`mb-8 p-6 flex items-center space-x-4 border-l-4 ${uploadStatus.type === 'success' ? 'bg-emerald-50/50 border-emerald-500 text-emerald-800' : 'bg-red-50/50 border-red-500 text-red-800'}`}>
          {uploadStatus.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-medium tracking-wide">{uploadStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* Massive Minimalist Dropzone */}
        <div className="lg:col-span-3">
          <div 
            className={`relative h-[400px] border border-dashed rounded-none flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging ? 'border-black bg-black/5 scale-[1.02]' : 'border-black/20 bg-white hover:border-black/50'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" />
            
            <Upload className={`w-8 h-8 mb-6 transition-colors ${isDragging ? 'text-black' : 'text-black/30'}`} strokeWidth={1} />
            <p className="text-xl font-serif text-black mb-2">Drag files to upload</p>
            <p className="text-sm text-slate-400 font-light mb-8">PDF, JPEG, or PNG (Max 10MB)</p>
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="text-sm font-semibold uppercase tracking-widest text-black/60 hover:text-black border-b border-black/20 hover:border-black transition-all pb-1"
            >
              Browse Files
            </button>
          </div>
        </div>

        {/* Clean File Queue (Only shows if files exist) */}
        <div className="lg:col-span-2">
          {files.length > 0 ? (
            <div className="flex flex-col h-[400px]">
              <div className="flex justify-between items-end mb-6 pb-4 border-b border-black/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black">Queue ({files.length})</h3>
                <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-black">Clear All</button>
              </div>
              
              <ul className="flex-1 overflow-y-auto space-y-4 pr-2">
                {files.map((file, idx) => (
                  <li key={idx} className="group flex justify-between items-start">
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-black truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <button 
                onClick={uploadFiles}
                disabled={uploading}
                className="mt-6 w-full group flex items-center justify-between bg-black text-white px-6 py-4 hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                <span className="text-lg font-serif italic">{uploading ? 'Processing...' : 'Upload Data'}</span>
                {!uploading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-black/5 bg-black/[0.02] text-slate-400">
              <p className="font-serif italic text-lg">No files queued.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}