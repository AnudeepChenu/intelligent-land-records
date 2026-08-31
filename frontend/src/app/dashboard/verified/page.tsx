'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Download,
  Edit3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function VerifiedDataPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Confidence drawer
  const [showConfidencePanel, setShowConfidencePanel] = useState(false);

  // Language dropdown
  const [docLanguage, setDocLanguage] = useState('te');

  // OCR confidence data
  // Kept in state but NOT displayed automatically
  const [confidenceData, setConfidenceData] = useState<
    { text: string; confidence: number }[]
  >([]);

  // Form data
  const [formData, setFormData] = useState({
    regNo: '',
    date: '',
    district: '',
    mandal: '',
    village: '',
    surveyNo: '',
    extent: '',
    owner: '',
    khata: '',
  });

  /*
   * ============================================================
   * FETCH DOCUMENTS
   * ============================================================
   */

  useEffect(() => {
    async function fetchDocuments() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);

        /*
         * Registry Queue is hidden.
         * Automatically select the newest document.
         */
        if (data.length > 0) {
          const latestDoc = data[0];

          setSelectedDoc(latestDoc);

          /*
           * Create preview URL
           */
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from('land_records')
            .createSignedUrl(latestDoc.file_path, 3600);

          if (!signedError && signedData) {
            setPreviewUrl(signedData.signedUrl);
          }
        }
      }

      setLoading(false);
    }

    fetchDocuments();
  }, []);

  /*
   * ============================================================
   * SELECT DOCUMENT
   * ============================================================
   *
   * Kept for existing functionality.
   */

  const handleSelectDoc = async (doc: any) => {
    setSelectedDoc(doc);

    // Reset confidence information when changing document
    setConfidenceData([]);

    // Close confidence drawer
    setShowConfidencePanel(false);

    const { data, error } = await supabase.storage
      .from('land_records')
      .createSignedUrl(doc.file_path, 3600);

    if (!error && data) {
      setPreviewUrl(data.signedUrl);
    }
  };

  /*
   * ============================================================
   * RUN AI EXTRACTION
   * ============================================================
   */

  const handleRunAI = async (id: string) => {
    setProcessing(true);

    try {
      const response = await fetch(
        'http://localhost:8000/process',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_id: id,
            language: docLanguage,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        /*
         * Update document list
         */
        setDocuments((currentDocuments) =>
          currentDocuments.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  status: 'extracted',
                  extracted_text: result.preview,
                }
              : doc
          )
        );

        /*
         * Update selected document
         */
        const updatedDoc = {
          ...selectedDoc,
          status: 'extracted',
          extracted_text: result.preview,
        };

        setSelectedDoc(updatedDoc);

        /*
         * Structured data
         */
        if (result.structured_data) {
          setFormData({
            regNo:
              result.structured_data.regNo || '',
            date:
              result.structured_data.date || '',
            district:
              result.structured_data.district || '',
            mandal:
              result.structured_data.mandal || '',
            village:
              result.structured_data.village || '',
            surveyNo:
              result.structured_data.surveyNo || '',
            extent:
              result.structured_data.extent || '',
            owner:
              result.structured_data.owner || '',
            khata:
              result.structured_data.khata || '',
          });
        }

        /*
         * Confidence data
         *
         * IMPORTANT:
         * This is stored but NOT shown automatically.
         */
        if (result.confidence_data) {
          setConfidenceData(result.confidence_data);
        }
      } else {
        alert(
          'Extraction failed: ' +
            result.detail
        );
      }
    } catch (err) {
      alert(
        'Could not connect to Python AI engine.'
      );
    } finally {
      setProcessing(false);
    }
  };

  /*
   * ============================================================
   * VERIFY DOCUMENT
   * ============================================================
   */

  const handleVerify = async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .update({
        status: 'verified',
        extracted_text: JSON.stringify(formData),
      })
      .eq('id', id);

    if (!error) {
      setDocuments((currentDocuments) =>
        currentDocuments.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                status: 'verified',
              }
            : doc
        )
      );

      if (selectedDoc?.id === id) {
        setSelectedDoc({
          ...selectedDoc,
          status: 'verified',
        });
      }
    }
  };

  /*
   * ============================================================
   * DOWNLOAD CERTIFICATE
   * ============================================================
   */

  const handleDownloadCertificate = () => {
    const pdf = new jsPDF();

    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, 190, 277);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);

    pdf.text(
      'GOVERNMENT OF TELANGANA',
      105,
      25,
      {
        align: 'center',
      }
    );

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    pdf.text(
      'OFFICE OF THE DISTRICT REVENUE AUTHORITY',
      105,
      33,
      {
        align: 'center',
      }
    );

    pdf.setLineWidth(0.2);
    pdf.line(20, 40, 190, 40);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);

    pdf.text(
      'OFFICIAL LAND REGISTRY VERIFICATION CERTIFICATE',
      105,
      55,
      {
        align: 'center',
      }
    );

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    pdf.text(
      'Verification Status: OFFICIALLY VERIFIED & SIGNED',
      20,
      75
    );

    pdf.text(
      `Registration No: ${formData.regNo}`,
      20,
      85
    );

    pdf.text(
      `Date of Issue: ${formData.date}`,
      20,
      95
    );

    pdf.setFont('helvetica', 'bold');

    pdf.text(
      'LAND PARTICULARS:',
      20,
      115
    );

    pdf.setFont('helvetica', 'normal');

    pdf.text(
      `District: ${formData.district}`,
      20,
      125
    );

    pdf.text(
      `Mandal: ${formData.mandal}`,
      20,
      132
    );

    pdf.text(
      `Village: ${formData.village}`,
      20,
      139
    );

    pdf.text(
      `Survey Number: ${formData.surveyNo}`,
      20,
      146
    );

    pdf.text(
      `Total Extent: ${formData.extent}`,
      20,
      153
    );

    pdf.setFont('helvetica', 'bold');

    pdf.text(
      'OWNERSHIP DETAILS:',
      20,
      173
    );

    pdf.setFont('helvetica', 'normal');

    pdf.text(
      `Registered Landholder: ${formData.owner}`,
      20,
      183
    );

    pdf.text(
      `Khata Number: ${formData.khata}`,
      20,
      190
    );

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');

    pdf.text(
      'DIGITALLY SIGNED BY LAND RECORDS AI ENGINE',
      20,
      240
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    pdf.text(
      `Generated on: ${new Date().toLocaleString()}`,
      20,
      247
    );

    pdf.save(
      `Verified_Record_${
        formData.surveyNo || 'Certificate'
      }.pdf`
    );
  };

  /*
   * ============================================================
   * FORM INPUT
   * ============================================================
   */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /*
   * ============================================================
   * CONFIDENCE CALCULATIONS
   * ============================================================
   */

  const averageConfidence =
    confidenceData.length > 0
      ? confidenceData.reduce(
          (sum, item) =>
            sum + item.confidence,
          0
        ) / confidenceData.length
      : 0;

  const lowConfidenceCount =
    confidenceData.filter(
      (item) => item.confidence < 0.75
    ).length;

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="relative max-w-[1400px] mx-auto overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out p-6">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-8">

        <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight mb-2">
          Record Verification.
        </h1>

        <p className="text-sm text-slate-500 font-light tracking-wide max-w-2xl">
          Review document previews side-by-side and issue official digital sign-offs.
        </p>

      </div>


      {/* ========================================================
          LOADING
      ======================================================== */}

      {loading ? (

        <div className="py-20 text-center font-serif text-slate-400 italic text-lg">
          Loading records registry...
        </div>

      ) : (

        /*
         * ======================================================
         * MAIN 50 / 50 LAYOUT
         * ======================================================
         */

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh] min-h-[600px]">

          {/* ====================================================
              LIVE PREVIEW
              50%
          ==================================================== */}

          <div className="border border-slate-200 bg-slate-100 flex flex-col shadow-sm min-w-0 min-h-0">

            {/* Preview Header */}

            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center flex-shrink-0">

              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">

                <Eye className="w-3 h-3 mr-2" />

                Live Preview

              </h3>

            </div>


            {/* Preview Body */}

            <div className="flex-1 p-2 min-h-0 overflow-hidden">

              {previewUrl ? (

                <iframe
                  src={previewUrl}
                  className="w-full h-full bg-white shadow-sm border border-slate-200"
                  title="Document Preview"
                />

              ) : (

                <div className="h-full flex items-center justify-center text-slate-400 font-serif italic text-sm">

                  No document available for preview

                </div>

              )}

            </div>

          </div>


          {/* ====================================================
              VERIFICATION PANEL
              50%
          ==================================================== */}

          <div className="border border-slate-200 bg-white flex flex-col shadow-sm min-w-0 min-h-0">

            {/* ==================================================
                VERIFICATION HEADER
            ================================================== */}

            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">

              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center">

                <Edit3 className="w-3 h-3 mr-2" />

                Verification Panel

              </h3>


              {/* =================================================
                  CONFIDENCE SCORE BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  setShowConfidencePanel(true)
                }
                disabled={
                  confidenceData.length === 0
                }
                className={`
                  flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  border
                  text-[9px]
                  uppercase
                  tracking-widest
                  font-bold
                  transition
                  flex-shrink-0
                  ${
                    confidenceData.length > 0
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }
                `}
              >

                <ShieldCheck className="w-3 h-3" />

                <span>
                  Confidence Score
                </span>

                {confidenceData.length > 0 && (

                  <span className="font-mono">
                    {(averageConfidence * 100).toFixed(0)}%
                  </span>

                )}

              </button>

            </div>


            {/* ==================================================
                VERIFICATION BODY
            ================================================== */}

            {selectedDoc ? (

              <div className="flex-1 flex flex-col overflow-hidden">

                {/* =================================================
                    FORM
                ================================================= */}

                <div className="flex-1 overflow-y-auto">

                  <div className="p-6 space-y-4">

                    {/* Registration + Date */}

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Registration No.
                        </label>

                        <input
                          type="text"
                          name="regNo"
                          value={formData.regNo}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>


                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Date of Issue
                        </label>

                        <input
                          type="text"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>

                    </div>


                    {/* District + Mandal */}

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          District
                        </label>

                        <input
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>


                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Mandal
                        </label>

                        <input
                          type="text"
                          name="mandal"
                          value={formData.mandal}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>

                    </div>


                    {/* Village + Survey Number */}

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Village
                        </label>

                        <input
                          type="text"
                          name="village"
                          value={formData.village}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>


                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Survey Number
                        </label>

                        <input
                          type="text"
                          name="surveyNo"
                          value={formData.surveyNo}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        />

                      </div>

                    </div>


                    {/* Total Extent */}

                    <div>

                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                        Total Extent
                      </label>

                      <input
                        type="text"
                        name="extent"
                        value={formData.extent}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                      />

                    </div>


                    {/* Landholder */}

                    <div>

                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                        Landholder Name
                      </label>

                      <input
                        type="text"
                        name="owner"
                        value={formData.owner}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                      />

                    </div>


                    {/* Khata */}

                    <div>

                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                        Khata Number
                      </label>

                      <input
                        type="text"
                        name="khata"
                        value={formData.khata}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                      />

                    </div>

                  </div>

                </div>


                {/* =================================================
                    BOTTOM ACTIONS
                ================================================= */}

                <div className="p-4 border-t border-slate-100 bg-white space-y-3 flex-shrink-0">

                  {/* =================================================
                      LANGUAGE + AI
                  ================================================= */}

                  {selectedDoc.status === 'pending' && (

                    <>

                      <div>

                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Document Language Profile
                        </label>

                        <select
                          value={docLanguage}
                          onChange={(e) =>
                            setDocLanguage(
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white text-black text-xs focus:border-black focus:outline-none"
                        >

                          <option value="te">
                            English + Telugu
                          </option>

                          <option value="mr">
                            English + Marathi
                          </option>

                          <option value="hi">
                            English + Hindi
                          </option>

                          <option value="en">
                            English Only
                          </option>

                        </select>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          handleRunAI(
                            selectedDoc.id
                          )
                        }
                        disabled={processing}
                        className="w-full py-2.5 bg-amber-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-amber-700 transition disabled:opacity-40"
                      >

                        {processing
                          ? 'Processing Document...'
                          : 'Run AI Extraction'}

                      </button>

                    </>

                  )}


                  {/* =================================================
                      VERIFY / DOWNLOAD
                  ================================================= */}

                  {selectedDoc.status !==
                  'verified' ? (

                    <button
                      type="button"
                      onClick={() =>
                        handleVerify(
                          selectedDoc.id
                        )
                      }
                      className="w-full py-2.5 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-black/80 transition flex items-center justify-center"
                    >

                      <CheckCircle2 className="w-3 h-3 mr-2" />

                      Approve & Verify Edits

                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={
                        handleDownloadCertificate
                      }
                      className="w-full py-2.5 bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-800 transition flex items-center justify-center"
                    >

                      <Download className="w-3 h-3 mr-2" />

                      Download Final PDF

                    </button>

                  )}

                </div>

              </div>

            ) : (

              <div className="flex-1 flex items-center justify-center text-slate-400 font-serif italic text-sm p-8 text-center">

                No document selected.

              </div>

            )}

          </div>

        </div>

      )}


      {/* ==========================================================
          CONFIDENCE SCORE DRAWER
          
          IMPORTANT:
          This is completely OUTSIDE the 50/50 grid.
          
          fixed + inset-0 means:
          - it does not affect page width
          - it does not create another grid column
          - it overlays the existing page
      ========================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[9999]
          ${
            showConfidencePanel
              ? 'pointer-events-auto'
              : 'pointer-events-none'
          }
        `}
      >

        {/* ========================================================
            BACKDROP
        ======================================================== */}

        <div
          onClick={() =>
            setShowConfidencePanel(false)
          }
          className={`
            absolute
            inset-0
            bg-black/20
            transition-opacity
            duration-300
            ${
              showConfidencePanel
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }
          `}
        />


        {/* ========================================================
            SLIDE-IN DRAWER
        ======================================================== */}

        <aside
          onClick={(e) =>
            e.stopPropagation()
          }
          className={`
            absolute
            top-0
            right-0
            h-full
            w-[420px]
            max-w-[90vw]
            bg-white
            shadow-2xl
            border-l
            border-slate-200
            flex
            flex-col
            transition-transform
            duration-300
            ease-out
            z-10
            ${
              showConfidencePanel
                ? 'translate-x-0'
                : 'translate-x-full'
            }
          `}
        >

          {/* ======================================================
              DRAWER HEADER
          ====================================================== */}

          <div className="h-[72px] px-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">

            <div>

              <div className="flex items-center gap-2">

                <ShieldCheck className="w-4 h-4 text-slate-700" />

                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                  Confidence Score
                </h3>

              </div>

              <p className="text-[9px] text-slate-400 font-mono mt-1">
                OCR ANALYSIS
              </p>

            </div>


            {/* ==================================================
                CLOSE BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                setShowConfidencePanel(
                  false
                );
              }}
              className="p-2 hover:bg-slate-200 transition cursor-pointer rounded-sm"
              aria-label="Close confidence score"
            >

              <X className="w-4 h-4 text-slate-500" />

            </button>

          </div>


          {/* ======================================================
              DRAWER BODY
          ====================================================== */}

          <div className="flex-1 overflow-y-auto">

            {confidenceData.length > 0 ? (

              <div className="p-5 space-y-5">

                {/* =================================================
                    OVERALL CONFIDENCE
                ================================================= */}

                <div className="border border-slate-200 p-4">

                  <div className="flex justify-between items-center mb-3">

                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                      Overall Confidence
                    </span>

                    <span className="text-lg font-mono font-bold text-black">

                      {(
                        averageConfidence *
                        100
                      ).toFixed(1)}
                      %

                    </span>

                  </div>


                  <div className="h-2 bg-slate-100 overflow-hidden">

                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          averageConfidence *
                            100,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {/* =================================================
                    REVIEW SUMMARY
                ================================================= */}

                <div
                  className={`
                    p-4
                    border
                    ${
                      lowConfidenceCount >
                      0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }
                  `}
                >

                  <div className="flex items-start gap-3">

                    {lowConfidenceCount >
                    0 ? (

                      <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />

                    ) : (

                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />

                    )}


                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">

                        {lowConfidenceCount >
                        0
                          ? 'Human Review Recommended'
                          : 'High Confidence Extraction'}

                      </p>


                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">

                        {lowConfidenceCount >
                        0
                          ? `${lowConfidenceCount} word${
                              lowConfidenceCount >
                              1
                                ? 's'
                                : ''
                            } detected below the 75% confidence threshold.`
                          : 'All detected words are above the 75% confidence threshold.'}

                      </p>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    OCR WORD ANALYSIS
                ================================================= */}

                <div>

                  <div className="flex justify-between items-center mb-3">

                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      OCR Word Analysis
                    </h4>

                    <span className="text-[9px] font-mono text-slate-400">
                      {confidenceData.length}{' '}
                      WORDS
                    </span>

                  </div>


                  <div className="border border-slate-200">

                    {confidenceData.map(
                      (item, idx) => {

                        const percentage =
                          Math.min(
                            item.confidence *
                              100,
                            100
                          );

                        const isLow =
                          item.confidence <
                          0.75;

                        return (

                          <div
                            key={idx}
                            className={`
                              px-3
                              py-3
                              border-b
                              border-slate-100
                              last:border-b-0
                              ${
                                isLow
                                  ? 'bg-rose-50'
                                  : 'bg-white'
                              }
                            `}
                          >

                            <div className="flex items-center justify-between gap-3">

                              <div className="flex items-center gap-2 min-w-0">

                                {isLow && (

                                  <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />

                                )}

                                <span
                                  className={`
                                    text-[11px]
                                    font-mono
                                    truncate
                                    ${
                                      isLow
                                        ? 'text-rose-900 font-bold'
                                        : 'text-slate-700'
                                    }
                                  `}
                                >
                                  {item.text}
                                </span>

                              </div>


                              <span
                                className={`
                                  text-[10px]
                                  font-mono
                                  font-bold
                                  flex-shrink-0
                                  ${
                                    isLow
                                      ? 'text-rose-700'
                                      : 'text-slate-500'
                                  }
                                `}
                              >

                                {percentage.toFixed(
                                  1
                                )}
                                %

                              </span>

                            </div>


                            {/* Confidence bar */}

                            <div className="mt-2 h-1 bg-slate-100 overflow-hidden">

                              <div
                                className={`
                                  h-full
                                  transition-all
                                  duration-500
                                  ${
                                    isLow
                                      ? 'bg-rose-500'
                                      : 'bg-slate-400'
                                  }
                                `}
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>


                {/* =================================================
                    LEGEND
                ================================================= */}

                <div className="pt-2">

                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">

                    <span className="w-2 h-2 bg-rose-500 flex-shrink-0" />

                    Below 75% — Review

                  </div>


                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono mt-2">

                    <span className="w-2 h-2 bg-slate-400 flex-shrink-0" />

                    75%+ — Higher confidence

                  </div>

                </div>

              </div>

            ) : (

              /* ==================================================
                 NO DATA
              ================================================== */

              <div className="h-full flex flex-col items-center justify-center p-8 text-center">

                <ShieldCheck className="w-8 h-8 text-slate-300 mb-3" />

                <p className="text-xs font-serif text-slate-500">
                  No confidence data available.
                </p>

                <p className="text-[9px] font-mono text-slate-400 mt-2 leading-relaxed">
                  Run AI Extraction to generate OCR confidence scores.
                </p>

              </div>

            )}

          </div>

        </aside>

      </div>

    </div>
  );
}