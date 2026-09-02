'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Trash2, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
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

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${doc.file_name}"?`)) return;
    setDeletingId(doc.id);

    try {
      // 1. Remove files from storage (Original + Annotated if exists)
      const filesToRemove = [doc.file_path];
      if (doc.structured_data?.annotated_path) {
        filesToRemove.push(doc.structured_data.annotated_path);
      }
      await supabase.storage.from('land_records').remove(filesToRemove);

      // 2. Remove entry from DB and catch errors strictly
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;

      // 3. Update UI state locally
      setDocuments(documents.filter((d) => d.id !== doc.id));

      // 4. Force Next.js to invalidate router cache
      router.refresh();

    } catch (err: any) {
      alert(`Error deleting document: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-10">
        <h1 className="text-4xl font-serif text-black tracking-tight mb-2">Registry Archive.</h1>
        <p className="text-sm text-slate-500 font-light max-w-2xl">
          View all uploaded and processed land records. Manage files and delete outdated data entries.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-widest text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold">Document Name</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Confidence</th>
                <th className="px-6 py-4 font-bold">Upload Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 font-serif italic text-slate-400">Loading registry data...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 font-serif italic text-slate-400">No documents found in the system.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-medium text-black">
                      <FileText className="w-4 h-4 mr-3 text-slate-400" />
                      {doc.file_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full ${
                        doc.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        doc.status === 'extracted' ? 'bg-blue-100 text-blue-800' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {doc.overall_confidence ? `${(doc.overall_confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}