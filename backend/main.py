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
import re

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

def smart_extract(text: str) -> dict:
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

class ProcessRequest(BaseModel):
    document_id: str
    language: str = "te"

@app.post("/process")
async def process_document(request: ProcessRequest):
    try:
        reader = get_ocr_reader(request.language)

        doc_res = supabase.table('documents').select('*').eq('id', request.document_id).execute()
        if not doc_res.data: raise HTTPException(status_code=404, detail="Not found")
        
        document = doc_res.data[0]
        supabase.table('documents').update({'status': 'processing'}).eq('id', request.document_id).execute()

        file_data = supabase.storage.from_('land_records').download(document['file_path'])
        
        extracted_text = ""
        confidence_data = []
        annotated_pages = []

        def process_image(img):
            nonlocal extracted_text, confidence_data
            results = reader.readtext(img, text_threshold=0.5, low_text=0.3, paragraph=False)
            for (bbox, text, prob) in results:
                extracted_text += text + " "
                confidence_data.append({"text": text, "confidence": float(prob)})
                
                # Draw boxes based on confidence
                top_left = tuple(map(int, bbox[0]))
                bottom_right = tuple(map(int, bbox[2]))
                
                if prob >= 0.8: color = (0, 255, 0)     # Green
                elif prob >= 0.5: color = (0, 255, 255) # Yellow
                else: color = (0, 0, 255)               # Red
                
                cv2.rectangle(img, top_left, bottom_right, color, 2)
                # Draw background for text to make it readable
                cv2.rectangle(img, (top_left[0], top_left[1]-15), (top_left[0]+40, top_left[1]), color, -1)
                cv2.putText(img, f"{prob*100:.0f}%", (top_left[0]+2, top_left[1]-3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0,0,0), 1)
            
            return img

        if document['file_type'] == 'application/pdf':
            pdf_document = fitz.open(stream=file_data, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                pix = page.get_pixmap(dpi=150)
                
                # IMPORTANT: .copy() prevents OpenCV readonly errors on memory views
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n).copy()
                
                if pix.n == 4: img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
                annotated_pages.append(process_image(img))
        else:
            # imdecode automatically allocates writable memory
            img = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
            annotated_pages.append(process_image(img))

        # Stitch multi-page documents vertically
        if len(annotated_pages) > 1:
            target_width = annotated_pages[0].shape[1]
            for i in range(1, len(annotated_pages)):
                h, w = annotated_pages[i].shape[:2]
                if w != target_width:
                    ratio = target_width / w
                    annotated_pages[i] = cv2.resize(annotated_pages[i], (target_width, int(h * ratio)))
            final_img = np.vstack(annotated_pages)
        else:
            final_img = annotated_pages[0]

        # Upload annotated image to Supabase
        _, buffer = cv2.imencode('.jpg', final_img)
        annotated_path = f"{document['uploader_id']}/{request.document_id}_annotated.jpg"
        
        try: supabase.storage.from_('land_records').remove([annotated_path])
        except: pass
        supabase.storage.from_('land_records').upload(annotated_path, buffer.tobytes(), {"content-type": "image/jpeg"})

        structured_data = smart_extract(extracted_text)
        overall_confidence = sum([c["confidence"] for c in confidence_data]) / len(confidence_data) if confidence_data else 0
        
        # Save structural context securely in DB
        structured_data['annotated_path'] = annotated_path
        structured_data['confidence_data'] = confidence_data

        supabase.table('documents').update({
            'status': 'extracted', 
            'extracted_text': extracted_text,
            'overall_confidence': overall_confidence,
            'structured_data': structured_data
        }).eq('id', request.document_id).execute()

        return {
            "status": "success", "structured_data": structured_data, "overall_confidence": overall_confidence
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        supabase.table('documents').update({'status': 'rejected'}).eq('id', request.document_id).execute()
        raise HTTPException(status_code=500, detail=str(e))