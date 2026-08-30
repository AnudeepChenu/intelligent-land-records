import os
import re
from dotenv import load_dotenv
import fitz  # PyMuPDF
import easyocr
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

print("--- STARTING AI ENGINE ---")

# 1. Load the environment variables from the .env file
load_dotenv()

# 2. Fetch the credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 3. Hard crash if they are missing
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL ERROR: Supabase credentials not found. Make sure your .env file is inside the 'backend' folder!")

print(f"Supabase URL Found: {SUPABASE_URL}")
print("Supabase Key Found: [HIDDEN FOR SECURITY]")

# 4. Initialize the global Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase Client Successfully Initialized.")

# 5. Initialize the FastAPI app
app = FastAPI(title="Land Records AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Initialize OCR (Loads into memory once, optimized for handwriting & text)
print("Loading OCR Engine (this takes a few seconds)...")
reader = easyocr.Reader(['en'])
print("OCR Engine Ready for Requests.")
print("--------------------------")

class ProcessRequest(BaseModel):
    document_id: str

@app.get("/")
async def root():
    return {"status": "online", "message": "AI Document Processing Engine is running."}

@app.post("/process")
async def process_document(request: ProcessRequest):
    try:
        print(f"Processing request for Document ID: {request.document_id}")
        
        # Fetch document metadata
        doc_res = supabase.table('documents').select('*').eq('id', request.document_id).execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found in database")
        
        document = doc_res.data[0]
        file_path = document['file_path']
        print(f"Found file path: {file_path}")

        # Update status
        supabase.table('documents').update({'status': 'processing'}).eq('id', request.document_id).execute()

        # Download file
        print("Downloading file from storage...")
        file_data = supabase.storage.from_('land_records').download(file_path)
        
        extracted_text = ""

        # Process file with handwriting-optimized parameters
        if document['file_type'] == 'application/pdf':
            print("File is PDF. Converting pages to images...")
            pdf_document = fitz.open(stream=file_data, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                pix = page.get_pixmap(dpi=200) # Higher DPI for faint handwriting strokes
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
                
                print(f"Running OCR on page {page_num + 1} (Handwriting Optimized)...")
                results = reader.readtext(
                    img, 
                    detail=0, 
                    text_threshold=0.5, 
                    low_text=0.3, 
                    paragraph=False
                )
                extracted_text += " ".join(results) + "\n"
        else:
            print("File is Image. Running handwriting-optimized OCR directly...")
            img = cv2.imdecode(np.frombuffer(file_data, np.uint8), cv2.IMREAD_COLOR)
            results = reader.readtext(
                img, 
                detail=0, 
                text_threshold=0.5, 
                low_text=0.3, 
                paragraph=False
            )
            extracted_text += " ".join(results)

        print("OCR Complete. Parsing structured land record fields...")
        
        # Pattern parsing for structured land record data
        survey_match = re.search(r"Survey Number[:\s]+([A-Za-z0-9/\-]+)", extracted_text, re.IGNORECASE)
        owner_match = re.search(r"Registered Landholder Name[:\s]+([A-Za-z\s]+)", extracted_text, re.IGNORECASE)
        extent_match = re.search(r"Total Extent[:\s]+([0-9\.\s[A-Za-z]+)", extracted_text, re.IGNORECASE)
        mandal_match = re.search(r"Mandal[:\s]+([A-Za-z]+)", extracted_text, re.IGNORECASE)

        structured_data = {
            "survey_number": survey_match.group(1).strip() if survey_match else "N/A",
            "owner_name": owner_match.group(1).strip() if owner_match else "N/A",
            "extent": extent_match.group(1).strip() if extent_match else "N/A",
            "mandal": mandal_match.group(1).strip() if mandal_match else "N/A"
        }

        print("Saving to database...")
        
        # Save extracted text and update status
        supabase.table('documents').update({
            'status': 'extracted',
            'extracted_text': extracted_text
        }).eq('id', request.document_id).execute()

        print("Success! Data saved.")
        return {
            "status": "success", 
            "document_id": request.document_id,
            "parsed_metadata": structured_data,
            "preview": extracted_text[:200] + "..." 
        }

    except Exception as e:
        print(f"ERROR OCCURRED: {str(e)}")
        try:
            supabase.table('documents').update({'status': 'rejected'}).eq('id', request.document_id).execute()
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))