import os
from dotenv import load_dotenv
import fitz  # PyMuPDF
import easyocr
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

print("--- STARTING LIGHTWEIGHT AI ENGINE ---")

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL ERROR: Supabase credentials not found.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Land Records AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OCR CACHE DICTIONARY FOR ON-DEMAND LANGUAGE LOADING
ocr_cache = {"current_lang": None, "reader": None}

def get_ocr_reader(lang_code: str):
    langs = ['en']
    if lang_code and lang_code != 'en':
        langs.append(lang_code)
    lang_key = "-".join(sorted(langs))
    
    if ocr_cache["current_lang"] != lang_key:
        print(f"\n[OCR] Loading model for languages: {langs}...")
        ocr_cache["reader"] = easyocr.Reader(langs, gpu=False)
        ocr_cache["current_lang"] = lang_key
        print("[OCR] Model loaded successfully.")
    return ocr_cache["reader"]

print("--- ENGINE READY ---")

class ProcessRequest(BaseModel):
    document_id: str
    language: str = "te"

import re

def smart_extract(text: str) -> dict:
    """Intelligently parses text for land record fields regardless of state formatting."""
    clean = text.replace('\n', ' ')
    
    def find(patterns):
        for p in patterns:
            m = re.search(p, clean, re.IGNORECASE)
            if m and m.group(1):
                return m.group(1).strip()
        return ""

    return {
        "regNo": find([r"Registration No[\s:.-]*([A-Z0-9\/]+)", r"Ulpin[\s:.-]*([A-Z0-9]+)"]),
        "date": find([r"Date of Issue[\s:.-]*([A-Za-z]+\s\d{1,2},?\s\d{4})", r"Date[\s:.-]*([\d\-\/]+)"]),
        "district": find([r"District[\s:.-]*([a-zA-Z]+)", r"Dist[\s:.-]*([a-zA-Z]+)"]),
        "mandal": find([r"Mandal[\s:.-]*([a-zA-Z]+)", r"Taluka[\s:.-]*([a-zA-Z]+)", r"Tehsil[\s:.-]*([a-zA-Z]+)"]),
        "village": find([r"Village[\s:.-]*([a-zA-Z0-9()]+)", r"Village\s*[:-]+\s*([a-zA-Z]+\(\d+\))"]),
        "surveyNo": find([r"Survey Number[\s:.-]*([a-zA-Z0-9\/]+)", r"Survey No[\s:.-]*([a-zA-Z0-9\/]+)", r"Gat No[\s:.-]*([a-zA-Z0-9\/]+)"]),
        "extent": find([r"Total Area\s*\(a\+b\)\s*[:.-]*([0-9\.]+)", r"Total Extent[\s:.-]*([0-9a-zA-Z\.\s]+)", r"Irrigated[\s:.-]*([0-9\.]+)"]),
        "owner": find([r"bhogavatadar[\s:a-zA-Z]*([a-zA-Z\s]{5,30})", r"Landholder Name[\s:.-]*([a-zA-Z\s]+)(?:Father|-)", r"Occupant[\s:.-]*([a-zA-Z\s]+)"]),
        "khata": find([r"khate kra\.?\s*(\d+)", r"Khata Number[\s:.-]*(\d+)"])
    }

@app.post("/process")
async def process_document(request: ProcessRequest):
    try:
        print(f"\nProcessing Document ID: {request.document_id} | Language: {request.language}")
        reader = get_ocr_reader(request.language)

        doc_res = supabase.table('documents').select('*').eq('id', request.document_id).execute()
        if not doc_res.data: raise HTTPException(status_code=404, detail="Not found")
        
        document = doc_res.data[0]
        supabase.table('documents').update({'status': 'processing'}).eq('id', request.document_id).execute()

        file_data = supabase.storage.from_('land_records').download(document['file_path'])
        extracted_text, confidence_data = "", []

        if document['file_type'] == 'application/pdf':
            pdf_document = fitz.open(stream=file_data, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                pix = page.get_pixmap(dpi=200)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                if pix.n == 4: img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
                
                results = reader.readtext(img, text_threshold=0.5, low_text=0.3, paragraph=False)
                for (bbox, text, prob) in results:
                    extracted_text += text + " "
                    confidence_data.append({"text": text, "confidence": float(prob)})
        else:
            img = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
            results = reader.readtext(img, text_threshold=0.5, low_text=0.3, paragraph=False)
            for (bbox, text, prob) in results:
                extracted_text += text + " "
                confidence_data.append({"text": text, "confidence": float(prob)})

        structured_data = smart_extract(extracted_text)

        supabase.table('documents').update({
            'status': 'extracted', 'extracted_text': extracted_text
        }).eq('id', request.document_id).execute()

        return {
            "status": "success", "preview": extracted_text,
            "confidence_data": confidence_data, "structured_data": structured_data
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        supabase.table('documents').update({'status': 'rejected'}).eq('id', request.document_id).execute()
        raise HTTPException(status_code=500, detail=str(e))